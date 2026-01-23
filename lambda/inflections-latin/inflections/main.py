#!/usr/bin/env python3
"""
CLI entry point for the Romance language verb conjugation service.

This module provides a command-line interface that emulates the Lambda handler
for local development and testing. Input is provided via a JSON file.

Usage:
    python main.py <input.json>

Example input.json:
    {
        "body": "{\"lemma\": \"essere\", \"pos\": \"VERB\"}"
    }
"""

import argparse
import json
import sys

import lambda_handler


def main():
    """
    Main entry point for CLI execution.

    Reads a JSON file containing a Lambda event and processes it
    through the lambda_handler, printing the response.
    """
    parser = argparse.ArgumentParser(
        description="Romance language verb conjugation CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Example usage:
    python main.py event.json

Example event.json:
    {
        "body": "{\\"lemma\\": \\"essere\\", \\"pos\\": \\"VERB\\"}"
    }
        """,
    )
    parser.add_argument(
        "input_file",
        type=str,
        help="Path to JSON file containing the Lambda event",
    )
    parser.add_argument(
        "--pretty",
        "-p",
        action="store_true",
        help="Pretty-print the JSON output",
    )

    args = parser.parse_args()

    try:
        with open(args.input_file, "r", encoding="utf-8") as f:
            event = {'body': f.read()}
    except FileNotFoundError:
        print(f"Error: File not found: {args.input_file}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {args.input_file}: {e}", file=sys.stderr)
        sys.exit(1)

    # Invoke the Lambda handler with the event
    response = lambda_handler.handler(event, None)

    # Print the response
    if args.pretty:
        print(json.dumps(response, indent=2, ensure_ascii=False))
    else:
        print(json.dumps(response, ensure_ascii=False))

    # Exit with non-zero status if the request failed
    if response.get("statusCode", 200) >= 400:
        sys.exit(1)


if __name__ == "__main__":
    main()
