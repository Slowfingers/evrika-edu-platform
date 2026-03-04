export const ssr = false;

export async function load({ params }) {
  return {
    id: params.id
  };
}
