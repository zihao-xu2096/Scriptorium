export async function getAuthorName(authorId: string | number): Promise<string> {
  try {
    const response = await fetch(`/api/user?userId=${authorId}`);
    const authorData = await response.json();
    return authorData ? `${authorData.firstName} ${authorData.lastName}` : 'Unknown Author';
  } catch (error) {
    console.error('Error fetching author name:', error);
    return 'Unknown Author';
  }
}