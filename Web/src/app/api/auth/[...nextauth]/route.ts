// src/app/api/auth/[...nextauth]/route.ts
/**
 * [파일 역할]
 * - NextAuth 설정 파일
 * - 인증 프로바이더 설정 (Credentials, Google, Kakao, Naver)
 * - JWT 및 세션 콜백 처리
 *
 * [사용되는 위치]
 * - 모든 인증 관련 요청에서 자동 호출
 * - /api/auth/* 엔드포인트
 *
 * [주의사항]
 * - NEXTAUTH_SECRET 환경 변수 필수
 * - 소셜 로그인은 해당 환경 변수가 있을 때만 활성화
 */

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NaverProvider from "next-auth/providers/naver";
import KakaoProvider from "next-auth/providers/kakao";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { normalizePhoneNumber } from "@/lib/utils/validation";
import { isAdminAccount } from "@/lib/auth/mockMode";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key-change-in-production",
  
  // 세션 전략: JWT 사용 (DB 세션 대신)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30일 (초 단위)
    updateAge: 24 * 60 * 60, // 24시간마다 갱신
  },

  // JWT 설정
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  // CSRF 보호 (기본 활성화, 추가 설정 가능)
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  providers: [
    // 이메일/비밀번호 로그인 (Credentials Provider)
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 1. 관리자 계정 확인 (DB 조회 전에 먼저 확인)
          const isAdmin = isAdminAccount(credentials.email, credentials.password);
          
          if (isAdmin) {
            console.log("[NextAuth] Admin account detected - Mock mode enabled");
            // 관리자 계정은 DB 조회 없이 바로 통과 (목업 모드)
            return {
              id: "admin-mock-user-id",
              email: credentials.email,
              name: "Admin (Mock Mode)",
            };
          }

          // 2. 일반 사용자: DB에서 사용자 조회
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              password: true,
              givenName: true,
              familyName: true,
            },
          });

          console.log("[NextAuth] User lookup:", {
            email: credentials.email,
            found: !!user,
            hasPassword: !!user?.password,
          });

          // 3. 사용자가 없거나 비밀번호가 없으면 실패
          if (!user || !user.password) {
            console.log("[NextAuth] Authentication failed: User not found or no password");
            return null;
          }

          // 4. 비밀번호 검증
          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          );

          console.log("[NextAuth] Password validation:", {
            isValid: isPasswordValid,
          });

          if (!isPasswordValid) {
            console.log("[NextAuth] Authentication failed: Invalid password");
            return null;
          }

          // 5. 인증 성공 - 사용자 정보 반환
          console.log("[NextAuth] Authentication successful:", {
            userId: user.id,
            email: user.email,
          });

          return {
            id: String(user.id),
            email: user.email,
            name: user.givenName
              ? `${user.familyName || ""} ${user.givenName}`.trim()
              : user.email,
          };
        } catch (error) {
          console.error("[NextAuth] Credentials authentication error:", error);
          return null;
        }
      },
    }),

    // 소셜 로그인 프로바이더 (환경 변수가 있을 때만 활성화)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    ...(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET
      ? [
          NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID,
            clientSecret: process.env.NAVER_CLIENT_SECRET,
            profile(profile) {
              console.log("[Naver Provider] Raw profile:", JSON.stringify(profile, null, 2));
              return {
                id: profile.response.id,
                name: profile.response.name,
                email: profile.response.email,
                image: profile.response.profile_image,
              };
            },
          }),
        ]
      : []),

    ...(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET
      ? [
          KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID,
            clientSecret: process.env.KAKAO_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[NextAuth signIn] Callback triggered");
      console.log("[NextAuth signIn] Provider:", account?.provider);
      console.log("[NextAuth signIn] User email:", user.email);
      console.log("[NextAuth signIn] Provider ID:", account?.providerAccountId);

      // 소셜 로그인 처리 (Google, Kakao, Naver)
      if (account?.provider !== "credentials" && account) {
        try {
          console.log("[NextAuth signIn] Starting social login flow");

          let existingUser = null;

          // 1. providerId로 먼저 확인 (이미 가입된 소셜 계정)
          if (account.providerAccountId) {
            existingUser = await prisma.user.findUnique({
              where: {
                providerId: account.providerAccountId,
              },
            });
            console.log("[NextAuth signIn] Existing user by providerId:", existingUser ? `ID ${existingUser.id}` : "NOT FOUND");
          }

          // 2. 이메일로 기존 사용자 확인 (이메일이 있는 경우)
          if (!existingUser && user.email) {
            existingUser = await prisma.user.findUnique({
              where: {
                email: user.email,
              },
            });
            console.log("[NextAuth signIn] Existing user by email:", existingUser ? `ID ${existingUser.id}` : "NOT FOUND");
          } else if (!existingUser) {
            console.log("[NextAuth signIn] No email provided, checking by phone");
          }

          // 2. 이메일로 찾지 못했으면 전화번호로 조회 시도
          if (!existingUser && profile) {
            let phoneNumber = "";

            // 프로바이더별 전화번호 추출
            if (account.provider === "kakao") {
              const kakaoProfile = profile as {
                kakao_account?: { phone_number?: string };
              };
              phoneNumber = kakaoProfile.kakao_account?.phone_number || "";
            } else if (account.provider === "naver") {
              const naverProfile = profile as {
                response?: { mobile?: string };
                mobile?: string;
              };
              // 네이버는 profile.response.mobile 또는 profile.mobile에 있을 수 있음
              phoneNumber = naverProfile.response?.mobile || naverProfile.mobile || "";
            }

            console.log("[NextAuth signIn] Phone number from profile:", phoneNumber || "NOT FOUND");

            // 전화번호가 있으면 정규화 후 조회
            if (phoneNumber) {
              const normalizedPhone = normalizePhoneNumber(phoneNumber);
              console.log("[NextAuth signIn] Normalized phone:", normalizedPhone);

              if (normalizedPhone) {
                existingUser = await prisma.user.findUnique({
                  where: {
                    phone: normalizedPhone,
                  },
                });

                if (existingUser) {
                  console.log(
                    `[NextAuth signIn] Account linking via phone number: ${normalizedPhone} (${account.provider}) - User ID: ${existingUser.id}`
                  );
                }
              }
            }
          }

          if (!existingUser) {
            // 3. 신규 사용자 - 임시 계정 생성 (소셜 프로필에서 받을 수 있는 정보는 저장)
            console.log(
              `[NextAuth signIn] ✨ NEW USER DETECTED - CREATING TEMPORARY ACCOUNT`
            );
            console.log(`[NextAuth signIn]    Email: ${user.email || "NO EMAIL"}`);
            console.log(`[NextAuth signIn]    Provider: ${account.provider}`);
            console.log(`[NextAuth signIn]    Provider ID: ${account.providerAccountId}`);

            // 소셜 프로필에서 정보 추출
            let phoneNumber = "";
            let givenName = null;
            let familyName = null;
            let birthDate = null;
            let gender = null;

            if (profile) {
              // 이름 추출
              const fullName = user.name || "";
              if (fullName) {
                // 이름을 공백으로 분리 (성 + 이름)
                const nameParts = fullName.trim().split(" ");
                if (nameParts.length >= 2) {
                  familyName = nameParts[0];
                  givenName = nameParts.slice(1).join(" ");
                } else {
                  givenName = nameParts[0];
                }
              }

              if (account.provider === "kakao") {
                const kakaoProfile = profile as {
                  kakao_account?: {
                    phone_number?: string;
                    name?: string; // 실명 (비즈 앱만 제공)
                    email?: string;
                    birthday?: string; // MMDD 형식
                    birthday_type?: string; // SOLAR or LUNAR
                    birthyear?: string; // YYYY 형식
                    gender?: string; // male or female
                  };
                  properties?: {
                    nickname?: string; // 닉네임 (일반 앱도 제공)
                  };
                };

                phoneNumber = kakaoProfile.kakao_account?.phone_number || "";

                // 카카오 이름 처리
                // 1순위: kakao_account.name (실명, 비즈 앱만)
                // 2순위: properties.nickname (닉네임, 일반 앱도 제공)
                // 3순위: user.name (NextAuth 기본)
                const kakaoName =
                  kakaoProfile.kakao_account?.name ||
                  kakaoProfile.properties?.nickname ||
                  "";

                if (kakaoName) {
                  const nameParts = kakaoName.trim().split(" ");
                  if (nameParts.length >= 2) {
                    // 공백이 있으면 "성 이름"으로 분리
                    familyName = nameParts[0];
                    givenName = nameParts.slice(1).join(" ");
                  } else {
                    // 공백이 없으면 givenName만 (닉네임인 경우)
                    givenName = nameParts[0];
                    familyName = null; // 성은 나중에 입력받기
                  }
                }

                // 생년월일 (양력인 경우만)
                if (
                  kakaoProfile.kakao_account?.birthday &&
                  kakaoProfile.kakao_account?.birthyear &&
                  kakaoProfile.kakao_account?.birthday_type === "SOLAR"
                ) {
                  const year = kakaoProfile.kakao_account.birthyear;
                  const mmdd = kakaoProfile.kakao_account.birthday;
                  const month = mmdd.substring(0, 2);
                  const day = mmdd.substring(2, 4);
                  birthDate = new Date(`${year}-${month}-${day}`);
                }

                // 성별
                if (kakaoProfile.kakao_account?.gender) {
                  gender = kakaoProfile.kakao_account.gender.toLowerCase();
                }
              } else if (account.provider === "naver") {
                const naverProfile = profile as {
                  response?: {
                    mobile?: string;
                    name?: string;
                    birthday?: string; // MM-DD 형식
                    birthyear?: string; // YYYY 형식
                    gender?: string; // M or F
                  };
                  mobile?: string;
                  name?: string;
                  birthday?: string;
                  birthyear?: string;
                  gender?: string;
                };

                const data = naverProfile.response || naverProfile;
                phoneNumber = data.mobile || "";

                // 네이버 이름
                if (data.name) {
                  const naverName = data.name;
                  const nameParts = naverName.trim().split(" ");
                  if (nameParts.length >= 2) {
                    familyName = nameParts[0];
                    givenName = nameParts.slice(1).join(" ");
                  } else {
                    givenName = nameParts[0];
                  }
                }

                // 생년월일
                if (data.birthday && data.birthyear) {
                  const year = data.birthyear;
                  const mmdd = data.birthday.replace("-", ""); // MM-DD → MMDD
                  const month = mmdd.substring(0, 2);
                  const day = mmdd.substring(2, 4);
                  birthDate = new Date(`${year}-${month}-${day}`);
                }

                // 성별 (M → male, F → female)
                if (data.gender) {
                  gender = data.gender === "M" ? "male" : data.gender === "F" ? "female" : null;
                }
              } else if (account.provider === "google") {
                // Google은 기본 스코프로는 name만 제공
                // birthDate, gender는 추가 스코프 필요
              }

              // 전화번호 정규화
              if (phoneNumber) {
                phoneNumber = normalizePhoneNumber(phoneNumber) || "";
              }
            }

            console.log(`[NextAuth signIn]    Extracted info:`, {
              givenName,
              familyName,
              birthDate: birthDate ? birthDate.toISOString().split("T")[0] : null,
              gender,
              phone: phoneNumber || null,
            });

            // 임시 User 생성 (받을 수 있는 정보는 저장, 나머지는 null)
            const newUser = await prisma.user.create({
              data: {
                email: user.email || `${account.providerAccountId}@${account.provider}.placeholder`,
                phone: phoneNumber || null,
                password: null, // 소셜 로그인은 비밀번호 없음
                provider: account.provider,
                providerId: account.providerAccountId,
                profileImageUrl: user.image || null,
                givenName,
                familyName,
                birthDate,
                gender,
                hasSurvey: false,
              },
            });

            const isProfileComplete = !!(givenName && familyName && birthDate && gender);
            console.log(
              `[NextAuth signIn] ✅ Temporary user created: ID ${newUser.id} (${account.provider})`
            );
            console.log(
              `[NextAuth signIn]    Profile ${isProfileComplete ? "COMPLETE" : "INCOMPLETE - needs additional info"}`
            );

            // 신규 사용자 기본 설정 생성 (기본 디바이스, Preset 등)
            try {
              const { createDefaultUserSetup } = await import("@/lib/auth/createDefaultUserSetup");
              await createDefaultUserSetup(newUser.id);
              console.log(`[NextAuth signIn] ✅ 기본 설정 생성 완료: User ID ${newUser.id}`);
            } catch (setupError) {
              console.error(`[NextAuth signIn] ⚠️ 기본 설정 생성 실패:`, setupError);
              // 기본 설정 생성 실패해도 로그인은 진행
            }

            // user.id를 DB의 ID로 설정
            user.id = String(newUser.id);
          } else {
            // 4. 기존 사용자 - provider 정보 업데이트
            const oldProvider = existingUser.provider;
            const oldProviderId = existingUser.providerId;

            // 이메일/전화번호로 찾은 경우 또는 provider 정보가 다른 경우 업데이트
            if (!oldProvider || oldProvider !== account.provider || oldProviderId !== account.providerAccountId) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  provider: account.provider,
                  providerId: account.providerAccountId,
                },
              });

              if (oldProvider && oldProvider !== account.provider) {
                console.log(
                  `[NextAuth signIn] ⚠️ Provider changed: ${oldProvider} → ${account.provider} for user ${existingUser.email}`
                );
              } else {
                console.log(
                  `[NextAuth signIn] ✅ Provider info linked: ${existingUser.email} → ${account.provider}`
                );
              }
            }

            // 5. user.id를 DB의 ID로 설정 (JWT에서 사용)
            user.id = String(existingUser.id);

            // 6. 이메일이 없으면 DB에서 가져오기
            if (!user.email && existingUser.email) {
              user.email = existingUser.email;
            }

            console.log(
              `[NextAuth signIn] ✅ Existing user logged in: ${user.email || existingUser.email} (${account.provider})`
            );
          }
        } catch (error) {
          console.error("[NextAuth] Social login error:", error);
          return false; // 로그인 실패
        }
      }

      return true; // 로그인 성공
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
