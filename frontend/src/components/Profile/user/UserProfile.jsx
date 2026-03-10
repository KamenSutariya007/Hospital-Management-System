import React, { useEffect, useState } from "react";
import profiePic from "../../../assets/human6.jpg";
import { NavLink } from "react-router-dom";
import axios from "axios";
import UserSidebar from "./UserSidebar";
import Swal from "sweetalert2";

function UserProfile() {
  // Initialize userData directly from localStorage
  const getUserData = () => {
    try {
      const userString = localStorage.getItem("user");
      if (userString) {
        return JSON.parse(userString);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    return null;
  };

  const formatDateOfBirth = (dob) => {
    if (!dob || dob === "" || dob === null || dob === undefined) return "";
    
    try {
      if (typeof dob === 'string') {
        // If it's already in YYYY-MM-DD format, return as is
        if (dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dob;
        }
        // Otherwise try to parse it
        const date = new Date(dob);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
        return dob.split("T")[0];
      } else if (dob instanceof Date) {
        if (!isNaN(dob.getTime())) {
          return dob.toISOString().split("T")[0];
        }
        return "";
      } else if (dob.$date) {
        // MongoDB date format
        const date = new Date(dob.$date);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
        return "";
      }
    } catch (error) {
      console.error("Error formatting date:", error, dob);
      return "";
    }
    return "";
  };

  const initialUser = getUserData();
  const [userData, setuserData] = useState(initialUser);
  const [userName, setName] = useState(initialUser?.userName || "");
  const [mobileNumber, setMobileNumber] = useState(initialUser?.phoneNumber || "");
  const [address, setAddress] = useState(initialUser?.address?.street || "");
  const [city, setCity] = useState(initialUser?.address?.city || "");
  const [state, setState] = useState(initialUser?.address?.state || "");
  const [dateOfBirth, setdateofBirth] = useState(formatDateOfBirth(initialUser?.dateOfBirth));
  const [gender, setGender] = useState(initialUser?.gender || "");
  const [email, setEmail] = useState(initialUser?.email || "");

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        // First try to get user from localStorage
        const userString = localStorage.getItem("user");
        if (!userString) {
          console.warn("No user data found in localStorage");
          return;
        }
        const user = JSON.parse(userString);
        
        if (user && user._id) {
          // Fetch latest data from users table
          try {
            const response = await axios.get(`http://localhost:5000/user/get-user/${user._id}`);
            if (response.data) {
              const latestUser = response.data;
              console.log("Fetched user data from API:", latestUser);
              console.log("Phone Number:", latestUser.phoneNumber);
              console.log("Date of Birth:", latestUser.dateOfBirth);
              
              // Update localStorage with latest data
              localStorage.setItem("user", JSON.stringify(latestUser));
              setuserData(latestUser);
              
              // Set all fields with latest data
              setName(latestUser.userName || "");
              const phoneValue = latestUser.phoneNumber || "";
              setMobileNumber(phoneValue);
              console.log("Setting mobile number to:", phoneValue);
              
              setAddress(latestUser.address?.street || "");
              setCity(latestUser.address?.city || "");
              setState(latestUser.address?.state || "");
              
              const formattedDateOfBirth = formatDateOfBirth(latestUser.dateOfBirth);
              setdateofBirth(formattedDateOfBirth);
              console.log("Setting date of birth to:", formattedDateOfBirth);
              
              setGender(latestUser.gender || "");
              setEmail(latestUser.email || "");
              return;
            }
          } catch (apiError) {
            console.warn("Could not fetch from API, using localStorage data:", apiError);
          }
          
          // Fallback to localStorage data if API fails
          console.log("Using localStorage data:", user);
          console.log("Phone from localStorage:", user.phoneNumber);
          console.log("DOB from localStorage:", user.dateOfBirth);
          
          setuserData(user);
          setName(user.userName || "");
          const phoneValue = user.phoneNumber || "";
          setMobileNumber(phoneValue);
          console.log("Setting mobile number from localStorage to:", phoneValue);
          
          setAddress(user.address?.street || "");
          setCity(user.address?.city || "");
          setState(user.address?.state || "");
          
          const formattedDateOfBirth = formatDateOfBirth(user.dateOfBirth);
          setdateofBirth(formattedDateOfBirth);
          console.log("Setting date of birth from localStorage to:", formattedDateOfBirth);
          
          setGender(user.gender || "");
          setEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchInfo();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!userData?._id) {
      Swal.fire({
        title: "Error",
        icon: "error",
        confirmButtonText: "Ok",
        text: "User data not found! Please login again.",
      });
      return;
    }
    try {
      axios
        .put("http://localhost:5000/user/profile-update", {
          userId: userData._id,
          updatedProfile: {
            email: email,
            userName: userName,
            phoneNumber: mobileNumber,
            address: {
              street: address,
              city: city,
              state: state,
            },
            gender: gender,
            dateOfBirth: dateOfBirth,
          },
        })
        .then((res) => {
          if (res.data.status === "Success" && res.data.user) {
            const user = res.data.user;
            // Update localStorage
            localStorage.setItem("user", JSON.stringify(user));
            // Update state immediately with new data
            setuserData(user);
            setName(user.userName || "");
            setMobileNumber(user.phoneNumber || "");
            setAddress(user.address?.street || "");
            setCity(user.address?.city || "");
            setState(user.address?.state || "");
            const formattedDateOfBirth = formatDateOfBirth(user.dateOfBirth);
            setdateofBirth(formattedDateOfBirth);
            setGender(user.gender || "");
            setEmail(user.email || "");
            
            Swal.fire({
              title: "Success",
              icon: "success",
              confirmButtonText: "Ok",
              text: "Profile Updated Successfully!",
            });
          } else {
            Swal.fire({
              title: "Error",
              icon: "error",
              confirmButtonText: "Ok",
              text: "Profile update failed. Please try again.",
            });
          }
        })
        .catch((err) => {
          Swal.fire({
            title: "Error",
            icon: "error",
            confirmButtonText: "Ok",
            text: "Error Updating Profile! Please Try Again!",
          });
          console.error("Update error:", err);
        });
    } catch (err) {
      Swal.fire({
        title: "Error",
        icon: "error",
        confirmButtonText: "Ok",
        text: "Error Updating Profile! Please Try Again!",
      });
      console.error("Update error:", err);
    }
  };

  return (
    <section className="bg-slate-300 flex justify-center items-center">
      <div className="h-[80%] w-[80%] bg-white shadow-xl p-2 flex">
        <UserSidebar profiePic={profiePic} userName={userData?.userName || ""} />
        <div className=" w-[70%] ms-24 p-4 flex flex-col justify-around ">
          <p className="font-semibold text-3xl">Account Settings</p>
          <form action="" className="flex flex-col h-[80%] justify-between">
            <div className="w-full flex justify-between">
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your Name:</p>
                <input
                  value={userName}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Name"
                ></input>
              </div>
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your Email:</p>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="email"
                  placeholder="Email"
                ></input>
              </div>
            </div>
            <div className="w-full flex justify-between">
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your Phone:</p>
                <input
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Phone"
                ></input>
              </div>
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your DOB:</p>
                <input
                  value={dateOfBirth}
                  onChange={(e) => setdateofBirth(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="date"
                  placeholder="Name"
                ></input>
              </div>
            </div>

            <div className="w-full flex justify-between">
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your Gender:</p>
                <input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Male/Female/Others"
                ></input>
              </div>
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your City:</p>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="City"
                ></input>
              </div>
            </div>
            <div className="w-full flex justify-between">
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your State:</p>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="State"
                ></input>
              </div>
              <div className="flex flex-col w-[50%] justify-start">
                <p>Enter Your Address:</p>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                  type="text"
                  placeholder="Address"
                ></input>
              </div>
            </div>
            <button
              onClick={handleUpdate}
              className="bg-black w-[95%] text-white p-2 rounded-full"
            >
              Update
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default UserProfile;
