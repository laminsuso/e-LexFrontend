import Draft from "./component/draft";
import { useState } from "react";
import ManageTemplates from "./component/manageTemplate";
export default function ManageTemplate(){
    const [requests,setRequests]=useState([])
    return(
        <div  className="w-full">
            <ManageTemplates requests={requests} setRequests={setRequests} />
        </div>
    )
}