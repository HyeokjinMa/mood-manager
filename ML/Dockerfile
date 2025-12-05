# AMD64 Architecture
FROM public.ecr.aws/lambda/python:3.11

# 1. System Dependencies
RUN yum install -y libsndfile libgomp gcc-c++ python3-devel

# 2. Python Libraries
COPY requirements_docker.txt .
RUN pip install -r requirements_docker.txt --target "${LAMBDA_TASK_ROOT}"

# 3. ONNX Model Copy
RUN mkdir -p ${LAMBDA_TASK_ROOT}/onnx_model
COPY onnx_model/model_quantized.onnx ${LAMBDA_TASK_ROOT}/onnx_model/

#4. Key File Copy
COPY moodManagerCredKey.json ${LAMBDA_TASK_ROOT}/
COPY predict.py ${LAMBDA_TASK_ROOT}/

#5. EXE
CMD [ "predict.lambda_handler" ]