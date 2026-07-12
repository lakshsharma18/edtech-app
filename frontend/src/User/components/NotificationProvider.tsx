import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Toast, ToastContainer, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaVideo } from "react-icons/fa";

interface NotificationContextType {
    activeNotification: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);


export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const navigate = useNavigate();

    const socketRef = useRef<WebSocket | null>(null);

    const [showToast, setShowToast] = useState(false);

    const [alertData, setAlertData] = useState<{
        course_id: number;
        course_title: string;
        instructor_name: string;
    } | null>(null);



    useEffect(() => {

        const token = localStorage.getItem("token");

        if (!token) return;


        try {

            // Decode JWT payload safely
            const payload = JSON.parse(
                atob(token.split(".")[1])
            );


            const role = payload?.role?.toLowerCase();


            // Instructor does not receive student notifications
            if (role === "instructor") {
                console.log("Instructor notification skipped");
                return;
            }



            const ws = new WebSocket(
                `wss://edtech-backend-gne3.onrender.com/api/v1/notifications/subscribe?token=${token}`
            );


            socketRef.current = ws;



            ws.onopen = () => {
                console.log("✅ Notification websocket connected");
            };



            ws.onmessage = (event) => {

                try {

                    const data = JSON.parse(event.data);


                    if(data.event_type === "LIVE_CLASS_STARTED") {


                        setAlertData({

                            course_id: Number(data.course_id),

                            course_title: data.course_title,

                            instructor_name: data.instructor_name

                        });


                        setShowToast(true);

                    }


                } catch(error){

                    console.error(
                        "Notification parsing failed",
                        error
                    );

                }

            };



            ws.onerror = () => {

                console.log(
                    "Notification websocket error"
                );

            };



            ws.onclose = () => {

                console.log(
                    "Notification websocket disconnected"
                );

            };



        } catch(error){

            console.error(
                "JWT decode error",
                error
            );

        }



        return () => {

            if(socketRef.current){

                socketRef.current.close();

                socketRef.current = null;

            }

        };


    }, []);




    const handleJoinClick = () => {

        if(!alertData) return;


        setShowToast(false);


        navigate(
            `/user/courses/${alertData.course_id}?joinLive=true`
        );

    };




    return (

        <NotificationContext.Provider
            value={{
                activeNotification:
                    alertData?.course_title || null
            }}
        >


            {children}



            <ToastContainer

                position="top-end"

                className="p-3 position-fixed"

                style={{
                    zIndex:999999,
                    top:"20px",
                    right:"20px"
                }}

            >


                <Toast

                    show={showToast}

                    onClose={() => setShowToast(false)}

                    delay={25000}

                    autohide

                    className="border-0 shadow-lg bg-dark text-white"

                >


                    <Toast.Header
                        className="bg-dark text-white"
                    >

                        <FaVideo className="text-danger me-2"/>

                        <strong className="me-auto">

                            🔴 Lecture Live

                        </strong>


                    </Toast.Header>



                    <Toast.Body className="bg-dark text-white">


                        <p className="small text-white-50">

                            Instructor{" "}

                            <strong>

                                {alertData?.instructor_name}

                            </strong>

                            {" "}started a live class.

                        </p>



                        <h6 className="text-info fw-bold">

                            {alertData?.course_title}

                        </h6>



                        <div className="d-flex justify-content-end gap-2 mt-3">


                            <Button

                                size="sm"

                                variant="secondary"

                                onClick={() => setShowToast(false)}

                            >

                                Dismiss

                            </Button>



                            <Button

                                size="sm"

                                variant="info"

                                onClick={handleJoinClick}

                            >

                                Join Class

                            </Button>


                        </div>


                    </Toast.Body>


                </Toast>


            </ToastContainer>


        </NotificationContext.Provider>

    );

};




export const useNotifications = () => {

    const context = useContext(NotificationContext);


    if(!context){

        throw new Error(
            "useNotifications must be inside NotificationProvider"
        );

    }


    return context;

};