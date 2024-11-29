const HOST = "http://localhost:3232";

async function queryAPI(endpoint: string, query_params: Record<string, string>) {
  const paramsString = new URLSearchParams(query_params).toString();
  const url = `${HOST}/${endpoint}?${paramsString}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(response.status, response.statusText);
  }
  return response.json();
}

export async function addPin(uid: string, lat: number, lng: number) {
  return await queryAPI("add-pin", {
    uid,
    lat: lat.toString(),
    lng: lng.toString(),
  });
}

export async function getAllPins() {
  return await queryAPI("get-pins", {});
}

export async function clearPins(uid: string) {
  return await queryAPI("clear-pins", {
    uid,
  });
}