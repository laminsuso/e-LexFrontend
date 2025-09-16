import CompletedComponent from "./component/completedcomponent";
import Draft from "./component/draft";
import SentForSignature from "./component/sentforsignature";

export default function Drafts(){
    return(
        <div className="w-full">
            <Draft />
        </div>
    )
}