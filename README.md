# finance-sls-lambda-node-db

This project works in conjunction with [finance-client]() and [finance-sls-lambda-node-stripe](https://github.com/twils0/finance-sls-lambda-node-stripe).

The overall project allows users to search for equities, by ticker, name, sector/category, or exchange, using PostgreSQL's full text search. Users can subscribe to view an equity's current price and description, provided by IEX, and to receive research emails, relevant to that equity, formatted and forwarded using AWS SES, SNS, and S3. The project includes custom login and sign up forms, using AWS Cogntio under the hood and including MFA and a custom email verification process that sends styled (template) emails with links, through a combination of AWS Lambda functions (Node), RDS, and SES. The sign up process uses a credit card input component from Stripe's React library and AWS Lambda functions (Node) to register the user as a customer with Stripe and to setup a recurring quarterly payment schedule, prorated for the first quarter.

finance-sls-lambda-node-db is a collection of AWS Lambda functions (Node), managed by Serverless, that handle API calls from a client and then interact with AWS Cognito and a PostgreSQL database, hosted on AWS RDS.

Each Lambda function handles API calls from AWS API Gateway. API Gateway authenticates certain functions using AWS Cognito, verifying the 'id' token provided by the client. These functions are then authenticated with AWS Cognito a second time, verifying the 'access' token provided by the client, which is updated much more frequently than the 'id' token.

API Gateway:

- /emails

  - POST - (authenticated) starts the verification process for a primary email address and/or an additional email address

  - PUT - verifies an email address, if not already verified

- /securities

  - /securities/search

    - GET - (authenticated) runs a PostgreSQL full text search of securities, by ticker, name, sector/category, or exchange, based on the 'search' param provided

- /users

  - DELETE - (authenticated) deletes a user from the database

  - GET - (authenticated) get the user's current (last viewed) security, a list of the securities to which the user is subscribed, and basic information (ticker, name, sector/category, exchange, etc.) on each security to which the user is subscribed

  - PUT - (authenticated) update the user's current (last viewed) security, the list of securities to which the user is subscribed, and/or user attribues (name, phone, email, and/or additional email)

SNS:

- forwardEmails - formats and forwards research emails relevant to a perticular security

- signUpUser - receives an SNS message from finance-sls-lambda-node-stripe and adds a user to Cogntio and to the database
