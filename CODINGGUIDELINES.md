# Coding Guidelines GO-SDK for Web

## General coding guidelines

[clean code](https://github.com/labs42io/clean-code-typescript)

## Project specific coding guidelines

### Naming conventions

- Types that are specific for API responses should have API suffix at the end of the type name. Example: **BoundingBoxAPI**

### Testing
- Test data should be stored in .json files so it doesn't trigger SonarQube checks

### Pull requests (PR)
- Developer creating PR should invite the whole team
- All the comments need to be addressed in one way or the other 
- Not all developers need to approve PR before it is closed, it depends on complexity and importance of changes
- If the PR contains only tiny amount of changes one approval is enough for the merge
- If the PR contains only minor amount of changes one approval and few hours of waiting for other developers to check it out is enough for the merge
- If the PR is big, at least two approvals are needed before it can be merged
- If the PR has changes that are high risk or affect the architecture/design of the SDK the PR should contain helpful comments by creator or even a meeting to go over the changes  
