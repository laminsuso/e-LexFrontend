import CompletedComponent from "./component/completedcomponent";
import Draft from "./component/draft";
import DraftDocs from "./component/draftdocs";
import SentForSignature from "./component/sentforsignature";

export default function Draftsdocs(){
    return(
        <div className="w-full">
          <DraftDocs/>
        </div>
    )
}