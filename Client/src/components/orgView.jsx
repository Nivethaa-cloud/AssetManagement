import { useState, useEffect, Component } from "react";
import { useHistory, Link } from "react-router-dom";
import { ReactSession } from "react-client-session";
import Axios from "axios";
import React from "react";

const OrgViewDashboard = ({onClick}) => {
  const [listOfOrgs, setListOfOrgs] = useState({});
  const [error, setError] = useState();
  let history = useHistory();
  const userid = ReactSession.get("username");

  //function handleClick(orgname) {
   // ReactSession.set("selectedOrg", orgname);
   // let selectedOrg = ReactSession.get("selectedOrg");
   // console.log("The currently selected organization" + selectedOrg);
   // document.getElementById("AssetList").setAttribute("hidden", "hidden");
   // history.push("/dashboard");
  //}

  const linkStyle = {
    textDecoration: "none",
    color: "white",
  };

  useEffect(() => {
    Axios.get(
      `http://localhost:3000/api/v1/orgs/OrgView/${userid}`
    )
      .then((response) => {
        //console.log(response);
        setListOfOrgs(response.data);
      })
      .catch((err) => {
        setError(err);
      });
  }, [userid]);

  return (
    <React.Fragment>
      {Object.entries(listOfOrgs).map(([key, value]) => {
        return (
          <ul className="list-group list-group-flush">
            {value.map((el) => {
              return (
                <li className="list-group-item bg-transparent" key={el.name}>
                  <div className="container-fluid buttonItem shadowbtn">
                    {/* <Link to="#" exact style={linkStyle}>
                      <span className="btnLabel">{el.name}</span>
                    </Link> */}
                    <button
                      className="toggle-btn"
                      onClick={()=>onClick(el.name)}
                    >
                      <span className="btnLabel">{el.name}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        );
      })}
    </React.Fragment>
  );
};
export default OrgViewDashboard;
