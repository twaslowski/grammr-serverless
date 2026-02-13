{
  "widgets": [
    {
      "type": "log",
      "x": 9,
      "y": 0,
      "width": 9,
      "height": 6,
      "properties": {
        "query": "SOURCE '/aws/apigateway/grammr-gateway-${env}/${env}' | fields context.routeKey | stats count() group by context.routeKey",
        "queryLanguage": "CWLI",
        "queryBy": "logGroupName",
        "logGroupPrefixes": {
          "accountIds": [],
          "logGroupPrefix": [],
          "logClass": "STANDARD"
        },
        "region": "eu-central-1",
        "title": "endpoint activity",
        "view": "table"
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 0,
      "width": 9,
      "height": 6,
      "properties": {
        "query": "SOURCE '/aws/apigateway/grammr-gateway-${env}/${env}' | fields context.status | stats count() group by context.status",
        "queryLanguage": "CWLI",
        "queryBy": "logGroupName",
        "logGroupPrefixes": {
          "accountIds": [],
          "logGroupPrefix": [],
          "logClass": "STANDARD"
        },
        "region": "eu-central-1",
        "title": "API Gateway response codes",
        "view": "table"
      }
    }
  ]
}