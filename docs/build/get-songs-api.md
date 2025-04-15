API Documentation: /api/v1/songs

1. Overview

The /api/v1/songs endpoint provides access to a user's music library. It allows for retrieving lists of songs, and potentially, in future iterations, creating, updating, and deleting song entries (depending on authorization and scope).
This API is designed to support User Story 2.1: "As a logged-in user, I want to view a list of all my accessible songs, displaying basic information (Title, Artist, Album, Duration)."    
The API is versioned (v1) to allow for future non-breaking changes.
2. Base URL

[your-api-base-url]/api/v1/songs

3. Authentication

All requests to this endpoint require user authentication.
Use session-based (cookie) authentication.

4. HTTP Methods

GET - Retrieve a list of songs.

5. GET /api/v1/songs - Retrieve Songs

Description: Retrieves a list of songs accessible to the authenticated user. This is the primary method for supporting User Story 2.1. By default, in the response data, the songs are ordered by title.
Parameters:
Query Parameters: These parameters allow for pagination of the results.

- page (integer, optional, default: 1): Specifies the page number for pagination.
- limit (integer, optional, default: 20, max: 100): Specifies the number of results per page.
- sort (string, optional): Specifies the sorting criteria.

