const express = require("express");
const app = express();
app.use(express.json());
let port = 3001;

const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let database = null;

const initializeDBServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(port, () => {
      console.log(`Server Running at http://localhost:${port}/`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBServer();

const convertJsonToStateObj = (jsonObj) => {
  return {
    stateId: jsonObj.state_id,
    stateName: jsonObj.state_name,
    population: jsonObj.population,
  };
};

const convertJsonDistrictToObj = (jsonObj) => {
  return {
    districtId: jsonObj.district_id,
    districtName: jsonObj.district_name,
    stateId: jsonObj.state_id,
    cases: jsonObj.cases,
    cured: jsonObj.cured,
    active: jsonObj.active,
    deaths: jsonObj.deaths,
  };
};

const convertJsonStatsToObj = (jsonObj) => {
  return {
    totalCases: jsonObj.totalCases,
    totalCured: jsonObj.totalCured,
    totalActive: jsonObj.totalActive,
    totalDeaths: jsonObj.totalDeaths,
  };
};

//API-1:Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  try {
    const getStatesQuery = `
    SELECT *
    FROM state
    ORDER BY state_id ASC;`;
    const statesList = await database.all(getStatesQuery);
    response.send(statesList.map((eachObj) => convertJsonToStateObj(eachObj)));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-2:Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateQuery = `
        SELECT *
        FROM state
        WHERE state_id = ${stateId};`;
    const state = await database.get(getStateQuery);
    response.send(convertJsonToStateObj(state));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-3:Returns a state based on the state ID

app.post("/districts/", async (request, response) => {
  try {
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const addDistrictQuery = `
    INSERT INTO 
        district (district_name,state_id,cases,cured,active,deaths)
    VALUES (
       '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths});`;
    await database.run(addDistrictQuery);
    response.send("District Successfully Added");
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-4:Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const getDistrictQuery = `
        SELECT * 
        FROM district
        WHERE district_id = ${districtId};`;
    const district = await database.get(getDistrictQuery);
    response.send(convertJsonDistrictToObj(district));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-5:Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};`;
    await database.run(deleteDistrictQuery);
    response.send("District Removed");
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-6:Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = request.body;
    const updateDistrictQuery = `
      UPDATE district
      SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
      WHERE district_id = ${districtId} ;`;
    await database.run(updateDistrictQuery);
    response.send("District Details Updated");
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-7:Returns the statistics of total cases, cured, active,-
//deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  try {
    const { stateId } = request.params;
    const getStateStatsQuery = `
        SELECT 
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM district
        WHERE state_id = ${stateId};`;
    const stateStats = await database.get(getStateStatsQuery);
    //console.log(stateStats);
    //response.send(stateStats);
    response.send(convertJsonStatsToObj(stateStats));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

//API-8:Returns an object containing the state name of
//a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  try {
    const { districtId } = request.params;
    const getStateNameOfDistrictQuery = `
        SELECT state_name
        FROM state JOIN district
        WHERE district_id = ${districtId};`;
    const stateNameOfDistrict = await database.get(getStateNameOfDistrictQuery);
    const stateNameObj = (Obj) => ({
      stateName: stateNameOfDistrict.state_name,
    });
    response.send(stateNameObj(stateNameOfDistrict));
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
});

module.exports = app;
