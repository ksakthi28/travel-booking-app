const axios = require("axios");

module.exports = async function (from, to) {
  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/distancematrix/json",
    {
      params: {
        origins: from,
        destinations: to,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    }
  );

  const el = res.data.rows[0].elements[0];
  if (el.status !== "OK") throw new Error("Distance error");

  return el.distance.value / 1000;
};
