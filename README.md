# tenX

One good thing about music, when it hits you, you feel no pain.

## Configuration

tenX uses a centralized configuration system based on environment variables. The default values are suitable for local development, but can be customized by setting environment variables.

### Environment Variables

Copy the `.env.example` file to `.env` to set custom environment variables:

```bash
cp .env.example .env
```

Then edit the `.env` file to customize your configuration.

Key configuration options:

- `NODE_ENV`: Set to `production` for production environment
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DATABASE`: MongoDB database name
- `PORT`: Application server port

See `.env.example` for a complete list of available configuration options.

## API Response Format

All API endpoints in tenX follow a standardized response format:

### Success Response

```json
{
  "success": true,
  "data": { ... } // Optional response data
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "ERROR_CODE" // Optional error code
}
```

HTTP status codes are also used appropriately:

- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error
