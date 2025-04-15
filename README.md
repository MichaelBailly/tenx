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
