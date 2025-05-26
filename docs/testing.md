# Prepare datastore for testing

```
db.users.insertOne({
  _id: "us12345",
  depth: 0, // Assuming root level user
  login: "test_user",
  parent: null, // Assuming no parent for this example
  password: "9fb7fe1217aed442b04c0f5e43b5d5a7d3287097", // SHA1 hash of "test_password"
  playlists: [],
  sessions: [],
  preferences: {
    playlist: {
      type: "default"
    },
    volume: 0.5,
    dislikes: {},
    likes: {},
    hiddenReviewHelper: false,
    audioFade: false
  }
})
```
