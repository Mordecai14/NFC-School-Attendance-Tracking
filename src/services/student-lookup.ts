export type Student = {
  first_name: string;
  last_name: string;
  grade: string | null;
  group_name: string | null;
};

export async function lookupStudent(
  uid: string,
  url: string | undefined,
  key: string | undefined,
  getAccessToken: () => Promise<string>,
  request: typeof fetch = fetch,
): Promise<Student | null> {
  if (!url || !key) throw new Error('Supabase is not configured');
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error('School authentication is required');

  const response = await request(`${url.replace(/\/$/, '')}/rest/v1/rpc/student_by_bracelet`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bracelet_uid: uid }),
  });
  if (!response.ok) throw new Error('Student lookup failed');
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error('Invalid student response');
  if (data.length === 0) return null;
  const student: unknown = data[0];
  if (
    !student || typeof student !== 'object' ||
    !('first_name' in student) || typeof student.first_name !== 'string' ||
    !('last_name' in student) || typeof student.last_name !== 'string' ||
    !('grade' in student) || (student.grade !== null && typeof student.grade !== 'string') ||
    !('group_name' in student) || (student.group_name !== null && typeof student.group_name !== 'string')
  ) throw new Error('Invalid student response');
  return student as Student;
}
