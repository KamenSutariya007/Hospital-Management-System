import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import profiePic from "../../../assets/doct2.jpg";
import axios from "axios";
import Swal from "sweetalert2";
import DoctorSidebar from "./DoctorSidebar";
import { useSelector } from "react-redux";

function DoctorAppointmen() {
  const [appointments, setAppointments] = useState([]);
  const [userData, setUserData] = useState(null);
  
  // Debug: Log appointments state changes
  useEffect(() => {
    console.log("Appointments state changed:", appointments);
    console.log("Appointments length:", appointments?.length);
    console.log("Is array:", Array.isArray(appointments));
  }, [appointments]);

  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    // Get user data from localStorage or Redux
    const getUserData = () => {
      try {
        const userString = localStorage.getItem("user");
        if (userString) {
          return JSON.parse(userString);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
      return currentUser || null;
    };

    const user = getUserData();
    setUserData(user);
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData?._id) {
        console.warn("No user ID found, cannot fetch appointments");
        return;
      }

      try {
        console.log("Fetching appointments for doctor ID:", userData._id);
        console.log("User data:", userData);
        console.log("Doctor name:", userData.name || userData.userName);
        console.log("Doctor email:", userData.email);
        
        // Fetch appointments by doctor ID
        let response;
        try {
          response = await axios.get(
            `http://localhost:5000/appointment/get-appointment/${userData._id}`
          );
        } catch (error) {
          console.error("Error fetching appointments:", error);
          // If error, try to fetch all and filter
          try {
            const allResponse = await axios.get(
              `http://localhost:5000/appointment/get-all-appointments`
            );
            response = allResponse;
          } catch (allError) {
            throw error;
          }
        }
        
        console.log("Appointments API response:", response.data);
        
        // Handle different response formats
        console.log("Raw response.data:", response.data);
        console.log("Response.data type:", typeof response.data);
        console.log("Is array:", Array.isArray(response.data));
        
        let appointmentsData = [];
        
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          // If we got all appointments, filter by doctor
          const doctorId = userData._id;
          const doctorIdString = doctorId.toString();
          const doctorName = userData.name || userData.userName || "";
          const doctorEmail = userData.email || "";
          
          // Check if this is all appointments (more than expected for one doctor)
          if (response.data.length > 10) {
            console.log("Got all appointments, filtering for doctor...");
            appointmentsData = response.data.filter(apt => {
              const aptDoctor = apt.doctor?.toString() || apt.doctor;
              return aptDoctor === doctorId || 
                     aptDoctor === doctorIdString ||
                     aptDoctor === doctorName ||
                     aptDoctor === doctorEmail ||
                     aptDoctor === userData.name ||
                     aptDoctor === userData.userName;
            });
            console.log("Filtered appointments:", appointmentsData.length);
          } else {
            appointmentsData = response.data;
          }
        } else if (response.data && response.data.message) {
          // If it's a message like "No Appointments Booked!"
          console.log("No appointments message:", response.data.message);
          // Try fallback: fetch all appointments and filter
          try {
            console.log("Trying fallback: fetching all appointments...");
            const allAppointmentsResponse = await axios.get(
              `http://localhost:5000/appointment/get-all-appointments`
            );
            console.log("All appointments response:", allAppointmentsResponse.data);
            
            if (allAppointmentsResponse.data && Array.isArray(allAppointmentsResponse.data)) {
              const doctorId = userData._id;
              const doctorIdString = doctorId.toString();
              const doctorName = userData.name || userData.userName || "";
              const doctorEmail = userData.email || "";
              
              console.log("Filtering criteria:", {
                doctorId,
                doctorIdString,
                doctorName,
                doctorEmail
              });
              
              console.log("All appointments before filter:", allAppointmentsResponse.data);
              
              // Log each appointment's doctor field for debugging
              allAppointmentsResponse.data.forEach((apt, idx) => {
                console.log(`Appointment ${idx + 1} doctor field:`, apt.doctor, "Type:", typeof apt.doctor);
                console.log(`Appointment ${idx + 1} full data:`, JSON.stringify(apt, null, 2));
              });
              
              appointmentsData = allAppointmentsResponse.data.filter(apt => {
                const aptDoctor = apt.doctor?.toString() || apt.doctor || "";
                console.log("Comparing appointment doctor:", aptDoctor, "with doctor ID:", doctorId, "Name:", doctorName);
                
                const matches = 
                  aptDoctor === doctorId || 
                  aptDoctor === doctorIdString ||
                  aptDoctor === doctorName ||
                  aptDoctor === doctorEmail ||
                  aptDoctor === userData.name ||
                  aptDoctor === userData.userName ||
                  (typeof aptDoctor === 'string' && aptDoctor.includes(doctorIdString)) ||
                  (typeof aptDoctor === 'object' && aptDoctor.toString() === doctorIdString);
                
                console.log("Match result:", matches, "for appointment:", apt.patient);
                
                if (matches) {
                  console.log("✓ Matched appointment:", apt);
                }
                return matches;
              });
              
              console.log("Filtered appointments from all:", appointmentsData.length);
              console.log("Filtered appointments:", appointmentsData);
            }
          } catch (fallbackError) {
            console.error("Fallback fetch failed:", fallbackError);
          }
        } else if (response.data && typeof response.data === 'object') {
          // Try to extract array from response if it's nested
          const dataArray = Object.values(response.data).find(val => Array.isArray(val));
          if (dataArray) {
            appointmentsData = dataArray;
          } else if (response.data._id || response.data.patient) {
            // Single appointment object
            appointmentsData = [response.data];
          }
        }
        
        console.log("Final appointments to set:", appointmentsData.length);
        console.log("Appointments data:", JSON.stringify(appointmentsData, null, 2));
        
        // Force state update - ensure we're setting a new array reference
        if (Array.isArray(appointmentsData) && appointmentsData.length > 0) {
          console.log("Setting appointments state with", appointmentsData.length, "items");
          setAppointments([...appointmentsData]);
        } else {
          console.log("Setting empty appointments array");
          setAppointments([]);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        console.error("Error details:", error.response?.data || error.message);
        setAppointments([]);
      }
    };

    if (userData && userData._id) {
      fetchData();
    }
  }, [userData?._id]);

  if (!userData) {
    return (
      <section className="bg-slate-300 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-xl">Loading...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-300 flex justify-center items-center min-h-screen">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <DoctorSidebar userName={userData?.name || userData?.userName || ""} profilePic={profiePic} />
        <div className=" w-[70%] ms-24 p-4 flex flex-col justify-start gap-5 ">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-3xl">Appointments</p>
            <div className="flex gap-4 items-center">
              <p className="text-sm text-gray-600">
                Total: {appointments?.length || 0} appointment{(appointments?.length || 0) !== 1 ? 's' : ''}
              </p>
              {appointments && appointments.length > 0 && (
                <p className="text-xs text-green-600">✓ Data loaded</p>
              )}
              {appointments && appointments.length > 0 && (
                <button
                  onClick={() => {
                    console.log("Current appointments state:", appointments);
                    console.log("Is array:", Array.isArray(appointments));
                    console.log("Length:", appointments.length);
                  }}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Debug
                </button>
              )}
            </div>
          </div>
          <div className="w-full">
            <div className="relative overflow-auto shadow-md sm:rounded-lg">
              <table key={`appointments-table-${appointments?.length || 0}`} className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      #
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Patient Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Appointment Date
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Appointment Time
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments && Array.isArray(appointments) && appointments.length > 0 ? (
                    appointments.map((item, index) => {
                      console.log(`Rendering appointment ${index + 1}:`, item);
                      return (
                        <tr key={item._id || `appt-${index}`} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {item.patient || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {item.appointmentDate || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {item.time || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              item.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                              item.status === "inProgress" ? "bg-yellow-100 text-yellow-800" :
                              item.status === "completed" ? "bg-green-100 text-green-800" :
                              item.status === "cancelled" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {item.status || "scheduled"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-6 py-4 text-center" colSpan="5">
                        <p className="text-gray-500">Sorry, You have No appointments !!</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Appointments count: {appointments?.length || 0} | 
                          Is Array: {Array.isArray(appointments) ? "Yes" : "No"} |
                          Type: {typeof appointments}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DoctorAppointmen;
