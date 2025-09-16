import React, { useState,useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "./baseUrl";
import { ToastContainer,toast } from "react-toastify";
export default function ContactBooks() {
  const [contacts, setContacts] = useState([]);
const [loading,setLoading]=useState(true)
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddContact = async() => {
   try{
let token=localStorage.getItem('token')
let headers={
  headers:{
    authorization:`Bearer ${token}`
  }
}
    let response=await axios.post(`${BASE_URL}/create-contactBook`,formData,headers)
    const newContact = {
      id: response.data.contact._id,
      ...formData,
    };
    setContacts([...contacts, newContact]);
    setShowAddContact(false);
    setFormData({ name: "", email: "", phone: "" });
    toast.success(response.data.message,{containerId:"contactbook"})
   }catch(e){
if(e?.response?.data?.error){
toast.error(e?.response?.data?.error,{containerId:"contactbook"})
}else{
  toast.error("Something went wrong please try again",{containerId:"contactbook"})
}
   }
  };

  const handleEditContact = async () => {  
    try {
      let token = localStorage.getItem('token');
      let headers = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      
      let response = await axios.patch(`${BASE_URL}/updateContactBook`, { ...formData, contact_id: currentContact?._id }, headers);
      const newContact = {
        id: response.data.contact._id,
        ...formData,
      };
      
      setContacts([...contacts, newContact]);
      setFormData({ name: "", email: "", phone: "" });
      toast.success(response.data.message, { containerId: "contactbook" });
      
    } catch (e) {
     
      if (e?.response?.data?.error) {
        toast.error(e?.response?.data?.error, { containerId: "contactbook" });
      } else {
        toast.error("Something went wrong please try again", { containerId: "contactbook" });
      }
    }
    
   
    setContacts(
      contacts?.map((contact) =>
        contact?._id === currentContact?._id ? { ...contact, ...formData } : contact
      )
    );
    setShowEditContact(false);
    setFormData({ name: "", email: "", phone: "" });
  };
  

  const handleDeleteContact = async(id) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
     try{
      let token = localStorage.getItem('token');
      let headers = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      let response=await axios.delete(`${BASE_URL}/deleteContactBook/${id}`,headers)
      toast.success(response.data.message,{containerId:"contactBook"})
      setContacts(contacts.filter((contact) => contact._id !== id));
     }catch(e){
      if(e?.response?.data?.error){
        toast.error(e?.response?.data?.error,{containerId:"contactBook"})
            }else{
              toast.error("Something went wrong please try again",{containerId:"contactBook"})
            }
     }
    }
  };

  const handleEditClick = (contact) => {
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    });
    setShowEditContact(true);
  };

  const totalPages = Math.ceil(contacts.length / itemsPerPage);
  const paginatedContacts = contacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  
  const fetchContactBooks=async()=>{
    try{
      let token=localStorage.getItem('token')
      let headers={
        headers:{
          authorization:`Bearer ${token}`
        }
      }
  let response=await axios.get(`${BASE_URL}/fetchContactBooks`,headers)
  setContacts(response.data.contactBooks)
  setLoading(false)
 
    }catch(e){
      if(e?.response?.data?.error){
  toast.error(e?.response?.data?.error,{containerId:"contactBook"})
      }else{
        toast.error("Something went wrong please try again",{containerId:"contactBook"})
      }
    }
  }

useEffect(()=>{
  fetchContactBooks();
},[])



  return (
   <>
   <ToastContainer containerId={"contactbook"}/>
   <div className="py-[8px] px-[16px] bg-white rounded-[10px] min-h-[430px] relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[23px] font-bold py-[8px] px-[16px]">
          Contacts Book
        </h2>
        <button
          onClick={() => setShowAddContact(true)}
          className="bg-red-600 text-white p-2 rounded flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

     {loading?<div class="h-[250px] flex justify-center items-center">
  <div class="op-loading op-loading-infinity w-[4rem] text-neutral"></div>
</div>:<>
      <div className="grid grid-cols-4 border-t border-b border-gray-200 py-3 px-4 font-bold text-[14px]">
        <div>Name</div>
        <div>Email</div>
        <div>Phone</div>
        <div>Action</div>
      </div>

      {paginatedContacts?.length==0?<>
        <div className="h-[200px] flex items-center justify-center text-gray-500">
    No Contact books found
  </div>
      </>:paginatedContacts.map((contact) => (
        <div
          key={contact.id}
          className="grid grid-cols-4 py-3 px-4 border-b border-gray-100 items-center"
        >
          <div className="font-bold">{contact.name}</div>
          <div className="text-sm text-gray-500">{contact.email}</div>
          <div className="text-sm text-gray-500">{contact.phone}</div>
          <div className="flex items-center gap-2">
            <button
               onClick={() => {
                handleEditClick(contact)
                setCurrentContact(contact)
               }}
              className="bg-[#29354a] text-white p-2 rounded flex items-center justify-center"
              title="Edit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>

            <button
              onClick={() => handleDeleteContact(contact._id)}
              className="bg-black text-white p-2 rounded flex items-center justify-center"
              title="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`mx-1 px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-[#002864] text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

    
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Add New Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddContact(false);
                  setFormData({ name: "", email: "", phone: "" });
                }}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContact}
                className="bg-[#29354a] text-white px-4 py-2 rounded"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}

     
      {showEditContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Edit Contact</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditContact(false);
                  setFormData({ name: "", email: "", phone: "" });
                }}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEditContact}
                className="bg-[#29354a] text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
     </>}
    </div>
   </>
  );
}