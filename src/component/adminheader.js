import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { BASE_URL } from "../baseUrl";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to false for mobile-first
  const [state, setState] = useState();
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check screen size and set responsive states
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.matchMedia('(max-width: 1023px)').matches;
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      
      setIsMobile(mobile);
      
      // On desktop, sidebar should be open by default
      // On mobile, sidebar should be closed by default
      if (desktop) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const menuItems = [
    {
      title: "Dashboard",
      path: "/admin",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      title: "Sign yourself",
      path: "/admin/sign-yourself",
      icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    },
    {
      title: "Request Signatures",
      path: "/admin/request-signatures",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
    {
      title: "Template",
      icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
      subItems: [
        { title: "Create Template", path: "/admin/template/create", icon: "M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
        { title: "Manage Templates", path: "/admin/template/manage", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
      ],
    },
    {
      title: "Documents",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      subItems: [
        { 
          title: "Need Your Sign", 
          path: "/admin/documents/need-sign",
          icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        },
        { 
          title: "In Progress", 
          path: "/admin/documents/in-progress",
          icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        },
        { 
          title: "Completed", 
          path: "/admin/documents/completed",
          icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        },
        { 
          title: "Drafts", 
          path: "/admin/documents/drafts",
          icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        },
        { 
          title: "Declined", 
          path: "/admin/documents/declined",
          icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
        },
      ],
    },
    {
      title: "ContactBook",
      path: "/admin/contactbook",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      title: "Settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      subItems: [
        { 
          title: "Preferences", 
          path: "/admin/settings/preferences",
          icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"  
        }, 
        { 
          title: "Signatures", 
          path: "/admin/settings/signatures", 
          icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"  
        }, 
      ],
    },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let token = localStorage.getItem('token');
      let headers = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      if (token) {
        let response = await axios.get(`${BASE_URL}/getProfile`, headers);
        setState(response.data.profile);
      }
    } catch (e) {
      // Handle error
    }
  };

  const MenuItem = ({ icon, title, path, subItems }) => {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

    const handleNavigation = () => {
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    };

    return (
      <li className="my-1">
        <NavLink
          to={path || '#'} 
          end
          className={({ isActive }) =>
            `flex items-center p-2 rounded hover:bg-gray-100 transition-colors duration-200 ${
              isActive && !subItems ? "bg-gray-100 text-blue-600" : ""
            }`
          }
          onClick={subItems ? (e) => {
            e.preventDefault();
            setIsSubmenuOpen(!isSubmenuOpen);
          } : handleNavigation}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
          <span className="ml-3 truncate">{title}</span>
          {subItems && (
            <svg className={`w-4 h-4 ml-auto transform transition-transform duration-200 flex-shrink-0 ${isSubmenuOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </NavLink>
        {subItems && isSubmenuOpen && (
          <ul className="ml-8 mt-1">
            {subItems.map((item, index) => (
              <li key={index} className="my-1">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center p-2 text-sm rounded hover:bg-gray-100 transition-colors duration-200 ${
                      isActive ? "bg-gray-100 text-blue-600" : ""
                    }`
                  }
                  onClick={handleNavigation}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="ml-2 truncate">{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed w-full top-0 left-0 bg-white shadow-sm z-30 h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2 sm:mr-4 p-2 hover:bg-gray-100 rounded transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to='/' className="flex items-center">
              <div className="flex justify-center items-center gap-1">
                <img 
                  src="https://res.cloudinary.com/dbjwbveqn/image/upload/v1744296499/icononly_transparent_nobuffer_xmjeis.png" 
                  alt="Company Logo" 
                  className="h-8 w-8 object-contain" 
                />
                <span className="hidden sm:inline font-semibold">E-Lex Signature</span>
                <span className="sm:hidden font-semibold">E-Lex</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center">
            <Link to='/pricing'>
              <button className="text-[#e10032] px-3 sm:px-4 py-2 rounded-[20px] border border-[#e10032] hover:bg-[#e10032] hover:text-white transition-colors duration-200 text-sm">
                <span className="hidden sm:inline">Upgrade Now</span>
                <span className="sm:hidden">Upgrade</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white shadow-md w-72 sm:w-80 lg:w-64 xl:w-72 z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* User Profile Section */}
        {localStorage.getItem('token') && state && (
          <>
            <NavLink 
              to="/admin/profile" 
              className="flex items-center p-4 hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {
                if (isMobile) {
                  setIsSidebarOpen(false);
                }
              }}
            >
              <img 
                src={state?.avatar} 
                alt="Avatar" 
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-12 lg:h-12 xl:w-16 xl:h-16 rounded-full mr-3 object-cover flex-shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate text-sm sm:text-base lg:text-sm xl:text-base">{state?.name}</p>
                <p className="text-xs text-gray-600 truncate">{state?.company}</p>
              </div>
            </NavLink>
            <hr className="mx-4 border-gray-200" />
          </>
        )}
        
        {/* Navigation Menu */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <MenuItem key={index} {...item} />
            ))}
            <li className="my-1 pt-4 border-t border-gray-200">
              <NavLink
                to={'/'}
                className="flex items-center p-2 rounded hover:bg-gray-100 text-red-600 hover:bg-red-50 transition-colors duration-200"
                onClick={() => {
                  localStorage.removeItem('token');
                  if (isMobile) {
                    setIsSidebarOpen(false);
                  }
                }}  
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="ml-3">Logout</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`pt-14 transition-all duration-300 ease-in-out min-h-screen ${
        isSidebarOpen && !isMobile ? "lg:ml-64 xl:ml-72" : "ml-0"
      }`} 
      style={{ backgroundColor: "#dedede" }}>
        <div className="p-2 sm:p-4 lg:p-6">
          <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-7rem)]">
            <div className="p-4 sm:p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;