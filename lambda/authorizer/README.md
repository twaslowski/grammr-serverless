# authorizer

This directory contains the code for a custom authorizer Lambda function used in an AWS API Gateway setup. The
authorizer function is responsible for validating incoming requests and determining whether they should be allowed or
denied access to the API resources.

## Mechanism

Right now, a simple token-based authentication mechanism is implemented.
This way, a shared token can be established between the client and the API Gateway.
However, a more bespoke authentication mechanism should be implemented using the Supabase JWTs
that the frontend is already using.