
### Build instructions
`npm install`
`npm run start`


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
- flags
