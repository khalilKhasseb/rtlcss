#!/usr/bin/env python3
"""
RTLCSS API Client Example in Python
This example demonstrates how to use the RTLCSS API service with Python.
"""

import requests
import time
import hmac
import hashlib
import json
import argparse


class RtlcssApiClient:
    """
    Python client for the RTLCSS API service
    """
    
    def __init__(self, api_key, api_secret, api_url="https://rtlcss-api.example.com"):
        """
        Initialize the client with API credentials
        
        :param api_key: Your API key
        :param api_secret: Your API secret
        :param api_url: The base URL of the API service
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.api_url = api_url.rstrip('/')
        
    def create_signature(self, path, method, timestamp):
        """
        Create an HMAC signature for API authentication
        
        :param path: Request path
        :param method: HTTP method (e.g., GET, POST)
        :param timestamp: Current timestamp in milliseconds
        :return: HMAC-SHA256 signature as a hex string
        """
        payload = f"{path}|{method}|{timestamp}"
        
        # Create HMAC-SHA256 signature
        signature = hmac.new(
            key=self.api_secret.encode('utf-8'),
            msg=payload.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return signature
        
    def convert_ltr_to_rtl(self, css, options=None):
        """
        Convert CSS from LTR to RTL
        
        :param css: CSS content to convert
        :param options: Optional RTLCSS configuration options
        :return: API response as a dictionary
        """
        path = "/api/convert/ltr-to-rtl"
        method = "POST"
        timestamp = int(time.time() * 1000)
        signature = self.create_signature(path, method, timestamp)
        
        # Prepare request
        url = f"{self.api_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "X-Timestamp": str(timestamp),
            "X-Signature": signature
        }
        
        data = {
            "css": css,
            "options": options or {}
        }
        
        # Send request
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        # Handle errors
        if response.status_code != 200:
            try:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Unknown error")
                error_code = error_data.get("error", {}).get("code", "UNKNOWN_ERROR")
                raise Exception(f"API Error ({error_code}): {error_message}")
            except (ValueError, KeyError):
                raise Exception(f"API Error: {response.status_code} - {response.text}")
        
        return response.json()
        
    def convert_rtl_to_ltr(self, css, options=None):
        """
        Convert CSS from RTL to LTR
        
        :param css: CSS content to convert
        :param options: Optional RTLCSS configuration options
        :return: API response as a dictionary
        """
        path = "/api/convert/rtl-to-ltr"
        method = "POST"
        timestamp = int(time.time() * 1000)
        signature = self.create_signature(path, method, timestamp)
        
        # Prepare request (same as convert_ltr_to_rtl but with different path)
        url = f"{self.api_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "X-Timestamp": str(timestamp),
            "X-Signature": signature
        }
        
        data = {
            "css": css,
            "options": options or {}
        }
        
        # Send request
        response = requests.post(url, headers=headers, json=data, timeout=30)
        
        # Handle errors
        if response.status_code != 200:
            try:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Unknown error")
                error_code = error_data.get("error", {}).get("code", "UNKNOWN_ERROR")
                raise Exception(f"API Error ({error_code}): {error_message}")
            except (ValueError, KeyError):
                raise Exception(f"API Error: {response.status_code} - {response.text}")
        
        return response.json()
    
    def test_connection(self):
        """
        Test the API connection
        
        :return: API response as a dictionary
        """
        path = "/api/test"
        method = "POST"
        timestamp = int(time.time() * 1000)
        signature = self.create_signature(path, method, timestamp)
        
        # Prepare request
        url = f"{self.api_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
            "X-Timestamp": str(timestamp),
            "X-Signature": signature
        }
        
        # Send request
        response = requests.post(url, headers=headers, json={}, timeout=30)
        
        # Handle errors
        if response.status_code != 200:
            try:
                error_data = response.json()
                error_message = error_data.get("error", {}).get("message", "Unknown error")
                error_code = error_data.get("error", {}).get("code", "UNKNOWN_ERROR")
                raise Exception(f"API Error ({error_code}): {error_message}")
            except (ValueError, KeyError):
                raise Exception(f"API Error: {response.status_code} - {response.text}")
        
        return response.json()


def main():
    """
    Command-line interface for the RTLCSS API client
    """
    parser = argparse.ArgumentParser(description="RTLCSS API Client")
    parser.add_argument("--api-key", required=True, help="API key for authentication")
    parser.add_argument("--api-secret", required=True, help="API secret for authentication")
    parser.add_argument("--api-url", default="https://rtlcss-api.example.com", help="Base URL of the API service")
    parser.add_argument("--input", help="Input CSS file path")
    parser.add_argument("--output", help="Output CSS file path")
    parser.add_argument("--direction", choices=["ltr-to-rtl", "rtl-to-ltr"], default="ltr-to-rtl", help="Conversion direction")
    parser.add_argument("--options", help="RTLCSS options as JSON")
    parser.add_argument("--test", action="store_true", help="Test the API connection")
    
    args = parser.parse_args()
    
    # Create client
    client = RtlcssApiClient(args.api_key, args.api_secret, args.api_url)
    
    try:
        if args.test:
            # Test the API connection
            print("Testing API connection...")
            result = client.test_connection()
            print("Connection successful!")
            print(f"API Status: {result['data']['apiStatus']}")
            print(f"RTLCSS Version: {result['meta']['rtlcssVersion']}")
            return
        
        # Parse options if provided
        options = None
        if args.options:
            try:
                options = json.loads(args.options)
            except ValueError as e:
                raise Exception(f"Invalid JSON for options: {e}")
        
        # Read input CSS
        css = None
        if args.input:
            with open(args.input, 'r', encoding='utf-8') as f:
                css = f.read()
        else:
            # Read from stdin if no input file
            import sys
            if not sys.stdin.isatty():
                css = sys.stdin.read()
            else:
                # Interactive mode
                print("Enter CSS (press Ctrl+D when finished):")
                css = sys.stdin.read()
        
        if not css:
            raise Exception("No CSS content provided")
        
        # Convert CSS
        if args.direction == "ltr-to-rtl":
            result = client.convert_ltr_to_rtl(css, options)
        else:  # rtl-to-ltr
            result = client.convert_rtl_to_ltr(css, options)
        
        # Get converted CSS
        converted_css = result['data']['converted']
        
        # Write output
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(converted_css)
            print(f"Converted CSS written to {args.output}")
            
            # Print stats
            stats = result['data']['stats']
            print(f"Original size: {stats['originalSize']} bytes")
            print(f"Converted size: {stats['convertedSize']} bytes")
            print(f"Processing time: {stats['processingTimeMs']} ms")
        else:
            # Write to stdout
            print(converted_css)
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()