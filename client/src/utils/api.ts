const HOST = "http://localhost:3232";

async function queryAPI(
  endpoint: string,
  query_params: Record<string, string>
) {
  // query_params is a dictionary of key-value pairs that gets added to the URL as query parameters
  // e.g. { foo: "bar", hell: "o" } becomes "?foo=bar&hell=o"
  const paramsString = new URLSearchParams(query_params).toString();
  const url = `${HOST}/${endpoint}?${paramsString}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(response.status, response.statusText);
  }
  return await response.json();
}

export async function addWord(uid: string, word: string) {
  return await queryAPI("add-word", {
    uid: uid,
    word: word,
  });
}

export async function getWords(uid: string) {
  return await queryAPI("list-words", {
    uid: uid,
  });
}

export async function clearUser(uid: string) {
  return await queryAPI("clear-user", {
    uid: uid,
  });
}

export async function geojson() {
  let response = await queryAPI("geojson", {});
  if (response["response_type"]==="success") {
    return JSON.parse(response["geo_json"])
  } else return Object.create(null);
}

export async function searchgeojson(q: string) {
  let response = await queryAPI("search_geojson", {query: q});
  if (response["response_type"] === "success") {
    return JSON.parse(response["geo_data"]);
  } else return undefined;
}