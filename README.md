## KA Comment Tracker
This program stores all of the comments posted on the KA website, starting with the most voted programs and working down. All the data is stored to a SQLite database under ./storage/all_posts.db

This program also stores all the scratchpads (projects), their stats, and number of questions/answers/comments/replies. 


### Build instructions
`npm install`
`npm run crawl` # This will crawl the KA top list and store the data in ./storage/all_posts.db


posts schema
- parentId: string
- id: string
- programId: string
- type: "question" | "answer" | "feedback" | "reply"
- authorKaid: string
- content: string
- date: date
- answerCount: int
- replyCount: int
- upvotes: int
- lowQualityScore: int
- flags: string (comma-separated)


scratchpads schema
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