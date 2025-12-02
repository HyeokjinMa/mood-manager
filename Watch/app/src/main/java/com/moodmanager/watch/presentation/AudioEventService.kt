// app/src/main/java/com/moodmanager/watch/presentation/AudioEventService.kt
package com.moodmanager.watch.presentation

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Base64
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.moodmanager.watch.R
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.sqrt

/**
 * 🎤 Mood Manager – Audio Event Service (Laughter / Sigh)
 *
 * - 1분마다 약 2초간 오디오 녹음
 * - 조용하거나 unknown → 저장하지 않음
 * - 평균적으로 1시간 동안 실제 이벤트가 없다면 → 랜덤 더미(laughter/sigh) 1건 생성
 * - audio_base64 필드에 Base64 WAV 저장 (파일 크기 문제 회피)
 *
 * Firestore 경로:
 *    users/testUser/raw_events/{auto_doc_id}
 */
class AudioEventService : Service() {

    private val TAG = "AudioEventService"

    private val TEST_USER_ID = "testUser"

    private val EVENT_INTERVAL_MS = 60 * 1000L  // 1분

    private val db = Firebase.firestore

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var runnable: Runnable

    private val NOTIFICATION_CHANNEL_ID = "AudioEventChannel"
    private val NOTIFICATION_ID = 2

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

        startForeground(NOTIFICATION_ID, createNotification())
        Log.d(TAG, "AudioEventService started.")

        runnable = Runnable {

            Log.d(TAG, "Runnable: capturing audio event...")

            captureAndMaybeSend()

            handler.postDelayed(runnable, EVENT_INTERVAL_MS)
        }

        handler.post(runnable)

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(runnable)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // -------------------------------------------------------------
    // 🔥 핵심 로직: 1분마다 더미 이벤트 생성
    // -------------------------------------------------------------
    private fun captureAndMaybeSend() {
        val now = System.currentTimeMillis()

        // 1분마다 더미 이벤트 생성 (테스트용)
        val dummyType = if ((0..1).random() == 0) "laughter" else "sigh"
        Log.d(TAG, "🔥 Creating dummy audio event type=$dummyType")

        // 더미 오디오 Base64 생성 (간단한 더미 WAV)
        val dummyBase64 = generateDummyAudioBase64()

        saveEvent(
            timestamp = now,
            base64 = dummyBase64
        )
    }

    // -------------------------------------------------------------
    // Firestore 저장
    // -------------------------------------------------------------
    private fun saveEvent(
        timestamp: Long,
        base64: String?
    ) {
        val data = hashMapOf<String, Any?>(
            "timestamp" to timestamp,
            "audio_base64" to base64,
            "ml_processed" to "pending"  // ML 처리 대기 상태
        )

        db.collection("users")
            .document(TEST_USER_ID)
            .collection("raw_events")
            .add(data)
            .addOnSuccessListener {
                Log.d(TAG, "✅ Audio event saved to Firestore (ml_processed=pending)")
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "❌ Failed to save audio event", e)
            }
    }

    // -------------------------------------------------------------
    // 더미 오디오 Base64 생성 (간단한 더미 WAV)
    // -------------------------------------------------------------
    private fun generateDummyAudioBase64(): String {
        // 간단한 더미 WAV 헤더 + 더미 PCM 데이터
        val sampleRate = 8000
        val durationMs = 2000
        val samples = sampleRate * durationMs / 1000
        val pcm = ShortArray(samples) { (Math.random() * Short.MAX_VALUE).toInt().toShort() }
        return wavPcmToBase64(pcm, sampleRate)
    }

    // -------------------------------------------------------------
    // 2초 녹음 → 특징 + Base64 WAV 생성
    // -------------------------------------------------------------
    private fun recordShortAudio(): AudioFeatures {

        val hasPermission = ContextCompat.checkSelfPermission(
            this, Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) {
            return AudioFeatures(60, 2000, true, null)
        }

        val sampleRate = 8000
        val channel = AudioFormat.CHANNEL_IN_MONO
        val format = AudioFormat.ENCODING_PCM_16BIT

        val minBuffer = AudioRecord.getMinBufferSize(sampleRate, channel, format)
        if (minBuffer <= 0) return AudioFeatures(60, 2000, true, null)

        val buffer = ShortArray(minBuffer)
        val audioRecord = AudioRecord(
            MediaRecorder.AudioSource.MIC,
            sampleRate, channel, format, minBuffer
        )

        val pcmCollected = ArrayList<Short>()
        var sumSquares = 0.0
        var total = 0
        var loud = 0

        val durationMs = 2000L
        val startTime = System.currentTimeMillis()

        audioRecord.startRecording()

        while (System.currentTimeMillis() - startTime < durationMs) {
            val read = audioRecord.read(buffer, 0, buffer.size)
            if (read > 0) {
                for (i in 0 until read) {
                    val s = buffer[i]
                    val v = s.toInt()
                    sumSquares += v * v
                    total++
                    if (abs(v) > 5000) loud++
                    pcmCollected.add(s)
                }
            }
        }

        audioRecord.stop()
        audioRecord.release()

        if (total == 0) return AudioFeatures(60, durationMs.toInt(), true, null)

        val rms = sqrt(sumSquares / total)
        val level = ((rms / Short.MAX_VALUE) * 100).coerceIn(0.0, 100.0).roundToInt()
        val loudFrac = loud.toDouble() / total
        val silent = loudFrac < 0.01

        val base64 =
            if (!silent) wavPcmToBase64(pcmCollected.toShortArray(), sampleRate) else null

        return AudioFeatures(level, durationMs.toInt(), silent, base64)
    }

    private fun guessEventType(f: AudioFeatures): String {
        if (f.isSilent) return "unknown"

        val level = f.dbfsLevel
        val dur = f.durationMs

        return when {
            level >= 60 && dur in 500..2500 -> "laughter"
            dur >= 1800 && level in 30..80 -> "sigh"
            else -> "unknown"
        }
    }

    data class AudioFeatures(
        val dbfsLevel: Int,
        val durationMs: Int,
        val isSilent: Boolean,
        val audioBase64: String?
    )

    private fun wavPcmToBase64(pcm: ShortArray, sampleRate: Int): String {

        val bytes = ByteArray(pcm.size * 2)
        var i = 0
        for (s in pcm) {
            bytes[i++] = (s.toInt() and 0xFF).toByte()
            bytes[i++] = ((s.toInt() shr 8) and 0xFF).toByte()
        }

        val header = createWavHeader(bytes.size, sampleRate, 1, 16)
        val wav = ByteArray(header.size + bytes.size)

        System.arraycopy(header, 0, wav, 0, header.size)
        System.arraycopy(bytes, 0, wav, header.size, bytes.size)

        return Base64.encodeToString(wav, Base64.NO_WRAP)
    }

    private fun createWavHeader(
        audioLen: Int, sampleRate: Int, channels: Int, bits: Int
    ): ByteArray {
        val totalLen = audioLen + 36
        val byteRate = sampleRate * channels * bits / 8
        val blockAlign = (channels * bits / 8).toShort()

        val h = ByteArray(44)

        fun wInt(offset: Int, value: Int) {
            h[offset] = (value and 0xFF).toByte()
            h[offset + 1] = ((value shr 8) and 0xFF).toByte()
            h[offset + 2] = ((value shr 16) and 0xFF).toByte()
            h[offset + 3] = ((value shr 24) and 0xFF).toByte()
        }

        fun wShort(offset: Int, value: Short) {
            h[offset] = (value.toInt() and 0xFF).toByte()
            h[offset + 1] = ((value.toInt() shr 8) and 0xFF).toByte()
        }

        "RIFF".toByteArray().copyInto(h, 0)
        wInt(4, totalLen)
        "WAVE".toByteArray().copyInto(h, 8)
        "fmt ".toByteArray().copyInto(h, 12)
        wInt(16, 16)
        wShort(20, 1)
        wShort(22, channels.toShort())
        wInt(24, sampleRate)
        wInt(28, byteRate)
        wShort(32, blockAlign)
        wShort(34, bits.toShort())
        "data".toByteArray().copyInto(h, 36)
        wInt(40, audioLen)

        return h
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val c = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Audio Event Monitoring",
                NotificationManager.IMPORTANCE_LOW
            )
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .createNotificationChannel(c)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Mood Manager")
            .setContentText("Monitoring audio events...")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .build()
    }
}
