#!/bin/bash

# scripts/local-aws-setup.sh
# script to create your fragments bucket and table 
# (NOTE: you will need to do this every time you (re)start the containers, since they don't store any data to disk):


# ---HOW TO USE THIS SCRIPT---
# NOTE-: RUN this script AFTER "docker compose up -d" command

# TO RUN THIS SCRIPT in Terminal:
# $ chmod +x ./scripts/local-aws-setup.sh
# $ docker compose up -d
#NOTE-:RUNNING===>   ./scripts/local-aws-setup.sh

# KEEP PRESSING ENTER UNTIL YOU SEE THE MESSAGE "LocalStack S3 Ready" ==> PRESS `Q` TO EXIT

# ---AFTER RUNNING THIS SCRIPT---
# In another terminal, start streaming the logs from your fragments server, so you can see what's happening when the tests run.
# Use docker ps to find your fragments service, and get its CONTAINER ID, which will look something like 26bf87fafef5. Use that CONTAINER ID to get logs for the container:
# 
#$ docker ps
#$ docker logs -f 26bf87fafef5
# 


# ----------------------------
# to create an S3 Bucket and DynamoDB Table in the mock AWS services we are running. 
# pass --endpoint-url flags to use the local versions of the services vsthe normal ones on AWS.
# NOTE-: one thing the scripts below do is wait for resources to become ready. This is something we often need to do with distributed systems
# ----------------------------
# Setup steps for working with LocalStack and DynamoDB local instead of AWS.
# Assumes aws cli is installed and LocalStack and DynamoDB local are running.

# ----------------------------
# Setup AWS environment variables
echo "Setting AWS environment variables for LocalStack"

echo "AWS_ACCESS_KEY_ID=test"
export AWS_ACCESS_KEY_ID=test

echo "AWS_SECRET_ACCESS_KEY=test"
export AWS_SECRET_ACCESS_KEY=test

echo "AWS_SESSION_TOKEN=test"
export AWS_SESSION_TOKEN=test

export AWS_DEFAULT_REGION=us-east-1
echo "AWS_DEFAULT_REGION=us-east-1"

# Wait for LocalStack to be ready, by inspecting the response from healthcheck
echo 'Waiting for LocalStack S3...'
until (curl --silent http://localhost:4566/_localstack/health | grep "\"s3\": \"\(running\|available\)\"" > /dev/null); do
    sleep 5
done
echo 'LocalStack S3 Ready'

# Create our S3 bucket with LocalStack
echo "Creating LocalStack S3 bucket: fragments"
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket fragments

# Setup DynamoDB Table with dynamodb-local, see:
# https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-1.html
echo "Creating DynamoDB-Local DynamoDB table: fragments"
aws --endpoint-url=http://localhost:8000 \
dynamodb create-table \
    --table-name fragments \
    --attribute-definitions \
        AttributeName=ownerId,AttributeType=S \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=ownerId,KeyType=HASH \
        AttributeName=id,KeyType=RANGE \
    --provisioned-throughput \
        ReadCapacityUnits=10,WriteCapacityUnits=5

# Wait until the Fragments table exists in dynamodb-local, so we can use it, see:
# https://awscli.amazonaws.com/v2/documentation/api/latest/reference/dynamodb/wait/table-exists.html
aws --endpoint-url=http://localhost:8000 dynamodb wait table-exists --table-name fragments

echo "Local AWS setup complete"
