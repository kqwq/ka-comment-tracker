## KA Comment Tracker
_This program has been updated to work with the new GraphQL API._

This program saves all of the comments posted on the KA website, starting with the most voted programs on the Top List and working down. It is saved as a SQLite database at `./storage/{current-date}.db`.

This program also stores all the scratchpads (projects), their stats, and number of questions/answers/comments/replies. 


### Build instructions
```yarn install```
```yarn start```

- This will crawl the KA top list and store the data in ./storage/{current-date}.db. Hit Ctrl+C to stop. I recommend running this in the background, it will scrape forever until you stop it.


### posts schema
- parentId: string
- id: string
- programId: string
- type: "question" | "answer" | "comment" | "reply"
- authorKaid: string
- content: string
- date: date
- answerCount: int
- replyCount: int
- upvotes: int
- lowQualityScore: int
- flags: string (comma-separated) (no longer works since GraphQL update)
- key: string


### scratchpads schema
- programId: string
- dateRetrieved: date
- title: string
- datePublished: date
- lastUpdated: date
- type: string
- codeLength: int
- authorKaid: string
- votes: int
- spinoffs: int
- postCount: int
- questionCount: int
- answerCount: int
- commentCount: int
- replyCount: int
