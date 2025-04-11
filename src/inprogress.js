import CompletedComponent from "./component/completedcomponent";
import InprogressComponent from "./component/inprogresscomponent";
import SentForSignature from "./component/sentforsignature";

export default function Inprogress(){
    return(
        <div className="w-full">
            <InprogressComponent/>
        </div>
    )
}