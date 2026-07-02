// import { useEffect, useState } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);

//   // 1. Load the data
//   useEffect(() => {
//     fetch('/race_data.json')
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   // 2. The "Game Loop": Advance the index every 50ms
//   useEffect(() => {
//     if (data.length === 0) return;

//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 50); // Speed of the replay

//     return () => clearInterval(timer);
//   }, [data]);

//   const car = data[index] || { X: 0, Y: 0 };

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   useEffect(() => {
//     if (data.length === 0) return;
//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 50);
//     return () => clearInterval(timer);
//   }, [data]);

//   const rawCar = data[index] || { X: 0, Y: 0 };

//   // NORMALIZATION MATH:
//   // We need to shift the negative values to start at 0,
//   // then divide by the range to map to the 0-439/0-499 scale.
//   // These factors (offset/scale) are specific to your dataset.
//   // Calculate the exact shift needed to place the first point (index 0)
//   // at the start of the path (431.61, 6.61)
//     const minX = Math.min(...data.map(p => p.X));
//   const maxX = Math.max(...data.map(p => p.X));
//   const minY = Math.min(...data.map(p => p.Y));
//   const maxY = Math.max(...data.map(p => p.Y));

//   // 2. Map telemetry data (minX/maxX) to SVG viewBox (0-439/0-499)
//   // We add a little padding (e.g., 20) to keep it inside the view
//   const normalizedX = 439 - (((rawCar.X - minX) / (maxX - minX)) * 400 + 20);
//   const normalizedY = ((rawCar.Y - minY) / (maxY - minY)) * 460 + 20;

//   return (
//     <div className="h-full flex flex-col items-center justify-center p-10">
//       <div className="w-full max-w-4xl aspect-[16/9]  overflow-hidden relative">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest">
//           Live Telemetry: Abu Dhabi
//         </h2>

//         {/* Set viewBox to match the SVG path data */}
//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full p-4">
//           {/* The Track Map */}
//           <path
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="gray"
//             strokeWidth="8"
//             fill="none"
//           />

//           {/* The Car */}
//           {data.map((point, i) => (
//             <circle
//               key={i}
//               cx={(point.X - 573) * 0.055 + 431}
//               cy={(point.Y - 2080) * 0.055 + 6}
//               r="1"
//               fill="white"
//             />
//           ))}
//         </svg>
//       </div>
//       <div className="mt-6 text-neutral-400 text-sm">
//         Replaying fastest lap data...
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);

//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   // Wait until data loads to render so we can calculate boundaries
//   if (data.length === 0) return null;

//   // 1. Find boundaries of the telemetry data automatically
//   const minX = Math.min(...data.map((p) => p.X));
//   const maxX = Math.max(...data.map((p) => p.X));
//   const minY = Math.min(...data.map((p) => p.Y));
//   const maxY = Math.max(...data.map((p) => p.Y));

//   // ==========================================
//   // 🎛️ ALIGNMENT DASHBOARD
//   // Tweak these values until the white dots match the gray track perfectly!
//   // ==========================================
//   const ALIGN = {
//     rotate90: true,  // Change to false if it rotates too far
//     flipX: false,    // Change to true if it looks mirrored left-to-right
//     flipY: true,     // Change to false if it looks upside down
//     stretchX: 400,   // Increase/decrease to make the shape wider/narrower
//     stretchY: 460,   // Increase/decrease to make the shape taller/shorter
//     shiftX: 20,      // Move the whole shape left/right
//     shiftY: 20,      // Move the whole shape up/down
//   };
//   // ==========================================

//   return (
//     <div className="h-full flex flex-col items-center justify-center p-10">
//       <div className="w-full max-w-4xl aspect-[16/9] overflow-hidden relative">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest">
//           Live Telemetry: Abu Dhabi
//         </h2>

//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full p-4">

//           {/* The Track Map */}
//           <path
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="gray"
//             strokeWidth="8"
//             fill="none"
//           />

//           {/* The Data Points */}
//           {data.map((point, i) => {
//             // 1. Convert to a percentage (0 to 1) based on max boundaries
//             let percentX = (point.X - minX) / (maxX - minX);
//             let percentY = (point.Y - minY) / (maxY - minY);

//             // 2. Rotate 90 degrees if toggled
//             if (ALIGN.rotate90) {
//               const temp = percentX;
//               percentX = percentY;
//               percentY = temp;
//             }

//             // 3. Mirror the axes if toggled
//             if (ALIGN.flipX) percentX = 1 - percentX;
//             if (ALIGN.flipY) percentY = 1 - percentY;

//             // 4. Apply the stretch and shift to fit the SVG
//             const finalX = percentX * ALIGN.stretchX + ALIGN.shiftX;
//             const finalY = percentY * ALIGN.stretchY + ALIGN.shiftY;

//             return (
//               <circle
//                 key={i}
//                 cx={finalX}
//                 cy={finalY}
//                 r="1.5"
//                 fill="white"
//               />
//             );
//           })}
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);

//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   if (data.length === 0) return null;

//   // 1. Find the boundaries to calculate the center of the telemetry data
//   const minX = Math.min(...data.map((p) => p.X));
//   const maxX = Math.max(...data.map((p) => p.X));
//   const minY = Math.min(...data.map((p) => p.Y));
//   const maxY = Math.max(...data.map((p) => p.Y));

//   const dataCenterX = (minX + maxX) / 2;
//   const dataCenterY = (minY + maxY) / 2;

//   // Center of your SVG ViewBox (439.42 / 2 and 499.5 / 2)
//   const svgCenterX = 219.71;
//   const svgCenterY = 249.75;

//   // ==========================================
//   // 🎛️ ALIGNMENT DASHBOARD 2.0 (Proportional)
//   // ==========================================
//   const ALIGN = {
//     swapXY: true,    // true rotates it 90 degrees
//     flipX: true,     // Mirrors left/right (Try true/false to match the hairpin)
//     flipY: false,    // Mirrors up/down
//     scale: 0.025,    // 👈 Increase to make bigger, decrease to make smaller
//     offsetX: 0,      // Nudge the whole shape left/right
//     offsetY: 0,      // Nudge the whole shape up/down
//   };
//   // ==========================================

//   return (
//     <div className="h-full flex flex-col items-center justify-center p-10">
//       <div className="w-full max-w-4xl aspect-[16/9] overflow-hidden relative">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest">
//           Live Telemetry: Abu Dhabi
//         </h2>

//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full p-4">
//           {/* The Track Map */}
//           <path
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="gray"
//             strokeWidth="8"
//             fill="none"
//           />

//           {/* The Data Points */}
//           {data.map((point, i) => {
//             // 1. Center the point around 0,0
//             let x = point.X - dataCenterX;
//             let y = point.Y - dataCenterY;

//             // 2. Swap axes (Rotate 90)
//             if (ALIGN.swapXY) {
//               const temp = x;
//               x = y;
//               y = temp;
//             }

//             // 3. Mirror axes if needed
//             if (ALIGN.flipX) x = -x;
//             if (ALIGN.flipY) y = -y;

//             // 4. Scale uniformly to preserve the real track shape
//             x = x * ALIGN.scale;
//             y = y * ALIGN.scale;

//             // 5. Move to the center of the SVG, apply manual offsets
//             const finalX = x + svgCenterX + ALIGN.offsetX;
//             const finalY = y + svgCenterY + ALIGN.offsetY;

//             return (
//               <circle
//                 key={i}
//                 cx={finalX}
//                 cy={finalY}
//                 r="1.5"
//                 fill="white"
//               />
//             );
//           })}
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect, useMemo } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   useEffect(() => {
//     if (data.length === 0) return;
//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 50);
//     return () => clearInterval(timer);
//   }, [data]);

//   // Calculate the exact boundaries of your data to set the camera (viewBox)
//   const bounds = useMemo(() => {
//     if (data.length === 0) return null;
//     const minX = Math.min(...data.map(p => p.X));
//     const maxX = Math.max(...data.map(p => p.X));
//     const minY = Math.min(...data.map(p => p.Y));
//     const maxY = Math.max(...data.map(p => p.Y));

//     // Create the polyline string (the track drawing)
//     const points = data.map(p => `${p.X},${p.Y}`).join(" ");

//     return {
//       minX, minY,
//       width: maxX - minX,
//       height: maxY - minY,
//       points
//     };
//   }, [data]);

//   if (!bounds || data.length === 0) return null;

//   const rawCar = data[index] || { X: 0, Y: 0 };

//   return (
//     <div className="h-full flex flex-col items-center justify-center p-10">
//       <div className="w-full max-w-4xl aspect-[16/9] relative">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
//           Live Telemetry
//         </h2>

//         {/* We dynamically set the viewBox to match the data's exact footprint.
//             We add a 5% margin so the track doesn't touch the edges. */}
//         <svg
//           viewBox={`${bounds.minX - (bounds.width * 0.05)} ${bounds.minY - (bounds.height * 0.05)} ${bounds.width * 1.1} ${bounds.height * 1.1}`}
//           className="w-full h-full"
//         >
//           {/* Automatically draw the track using the lap data */}
//           <polyline
//             points={bounds.points}
//             stroke="#404040"
//             strokeWidth={bounds.width * 0.015} // Scale line thickness automatically
//             fill="none"
//             strokeLinejoin="round"
//           />

//           {/* The car uses the exact same raw X/Y, guaranteeing perfect alignment */}
//           <circle
//             cx={rawCar.X}
//             cy={rawCar.Y}
//             r={bounds.width * 0.02} // Scale dot size automatically
//             fill="#ef4444"
//             className="transition-all duration-75 ease-linear"
//           />
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);

//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   useEffect(() => {
//     if (data.length === 0) return;
//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 50); // Speed of the replay
//     return () => clearInterval(timer);
//   }, [data]);

//   if (data.length === 0) return null;

//   const car = data[index];

//   // 1. Calculate the bounding box of the actual data
//   const minX = Math.min(...data.map((p) => p.X));
//   const maxX = Math.max(...data.map((p) => p.X));
//   const minY = Math.min(...data.map((p) => p.Y));
//   const maxY = Math.max(...data.map((p) => p.Y));

//   // 2. Add some padding so the track doesn't touch the edge of the screen
//   const padding = (maxX - minX) * 0.1;

//   // 3. Create a dynamic SVG viewBox based on the data's real coordinates
//   const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;

//   // 4. Generate the track line directly from the raw data
//   const trackPoints = data.map((p) => `${p.X},${p.Y}`).join(" ");

//   return (
//     <div className="h-full flex flex-col items-center justify-center p-10">
//       <div className="w-full max-w-4xl aspect-[16/9] overflow-hidden relative">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
//           Live Telemetry: Silverstone
//         </h2>

//         {/* The SVG automatically scales to fit whatever data you feed it */}
//         <svg viewBox={viewBox} className="w-full h-full p-4 transform -scale-y-100">
//           {/* Track Line */}
//           <polyline
//             points={trackPoints}
//             stroke="#404040" // Gray track
//             strokeWidth={(maxX - minX) * 0.015} // Dynamic line thickness
//             strokeLinejoin="round"
//             fill="none"
//           />

//           {/* Car */}
//           <circle
//             cx={car.X}
//             cy={car.Y}
//             r={(maxX - minX) * 0.02} // Dynamic dot size
//             fill="#ef4444" // Red dot
//             className="transition-all duration-75 ease-linear"
//           />
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect, useRef } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);

//   // State to hold the perfect X/Y coordinates for the dot
//   const [carPos, setCarPos] = useState({ x: 0, y: 0 });

//   // A reference to your gray SVG track path
//   const trackRef = useRef<SVGPathElement>(null);

//   // 1. Load the data (We will only use it for timing/speed now)
//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   // 2. The Game Loop
//   useEffect(() => {
//     if (data.length === 0) return;

//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 50);

//     return () => clearInterval(timer);
//   }, [data]);

//   // 3. The Magic Alignment Math
//   useEffect(() => {
//     if (data.length === 0 || !trackRef.current) return;

//     // Calculate how far along the lap we are (0.0 to 1.0)
//     const progress = index / data.length;

//     // Get the total length of your SVG drawing in pixels
//     const totalLength = trackRef.current.getTotalLength();

//     // Ask the browser: "What are the exact X/Y coordinates at this percentage?"
//     const point = trackRef.current.getPointAtLength(progress * totalLength);

//     // Update the car's position
//     setCarPos({ x: point.x, y: point.y });

//   }, [index, data]); // Runs every time the index changes

//   return (
//     <div className="h-full flex flex-col items-center justify-center p-10">
//       <div className="w-full max-w-4xl aspect-[16/9] overflow-hidden relative">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
//           Live Telemetry: Abu Dhabi
//         </h2>

//         {/* Use your original viewBox */}
//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full p-4">

//           {/* Your exact Abu Dhabi SVG Path. Notice we added ref={trackRef} */}
//           <path
//             ref={trackRef}
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="#404040"
//             strokeWidth="8"
//             fill="none"
//           />

//           {/* The Car - Positioned perfectly using the path coordinates */}
//           {carPos.x !== 0 && (
//             <circle
//               cx={carPos.x}
//               cy={carPos.y}
//               r="10"
//               fill="#ef4444"
//               className="transition-all duration-75 ease-linear"
//             />
//           )}
//         </svg>
//       </div>
//       <div className="mt-6 text-neutral-400 text-sm">
//         Replaying fastest lap data...
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect, useRef } from "react";

// const RaceTrack = () => {
//   const [data, setData] = useState<any[]>([]);
//   const [index, setIndex] = useState(0);
//   const [carPos, setCarPos] = useState({ x: 0, y: 0 });
//   const trackRef = useRef<SVGPathElement>(null);

//   useEffect(() => {
//     fetch("/race_data.json")
//       .then((res) => res.json())
//       .then((data) => setData(data));
//   }, []);

//   useEffect(() => {
//     if (data.length === 0) return;
//     const timer = setInterval(() => {
//       setIndex((prev) => (prev + 1) % data.length);
//     }, 50);
//     return () => clearInterval(timer);
//   }, [data]);

//   useEffect(() => {
//     if (data.length === 0 || !trackRef.current) return;
//     const progress = index / data.length;
//     const pathLength = trackRef.current.getTotalLength();
//     const point = trackRef.current.getPointAtLength(progress * pathLength);
//     setCarPos({ x: point.x, y: point.y });
//   }, [index, data]);

//   return (
//     // Removed 'p-10' and 'flex-col' to allow the parent container
//     // to control the layout (as planned in LiveSimulator.tsx)
//     <div className="w-full h-full flex items-center justify-center">
//       <div className="w-full h-full relative p-8">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
//           Live Telemetry: Abu Dhabi
//         </h2>

//         {/* Removed p-4 to let the SVG fill the div space */}
//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full">
//           <path
//             ref={trackRef}
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="#404040"
//             strokeWidth="8"
//             fill="none"
//           />

//           {carPos.x !== 0 && (
//             <circle
//               cx={carPos.x}
//               cy={carPos.y}
//               r="6"
//               fill="#ef4444"
//               className="transition-all duration-75 ease-linear"
//             />
//           )}
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useState, useEffect, useRef } from "react";

// // 1. Mock data for 20 drivers
// const INITIAL_DRIVERS = [
//   { id: "VER", color: "#3b82f6", progress: 0.00 },
//   { id: "LEC", color: "#ef4444", progress: 0.02 },
//   { id: "RUS", color: "#2dd4bf", progress: 0.04 },
//   { id: "NOR", color: "#f97316", progress: 0.06 },
//   { id: "PIA", color: "#f97316", progress: 0.08 },
//   { id: "ALO", color: "#10b981", progress: 0.10 },
//   { id: "HAM", color: "#2dd4bf", progress: 0.12 },
//   { id: "TSU", color: "#1e3a8a", progress: 0.14 },
//   { id: "STR", color: "#10b981", progress: 0.16 },
//   { id: "SAI", color: "#ef4444", progress: 0.18 },
//   { id: "GAS", color: "#ec4899", progress: 0.20 },
//   { id: "OCO", color: "#ec4899", progress: 0.22 },
//   { id: "ALB", color: "#3b82f6", progress: 0.24 },
//   { id: "SAR", color: "#3b82f6", progress: 0.26 },
//   { id: "RIC", color: "#1e3a8a", progress: 0.28 },
//   { id: "BOT", color: "#991b1b", progress: 0.30 },
//   { id: "ZHO", color: "#991b1b", progress: 0.32 },
//   { id: "MAG", color: "#f3f4f6", progress: 0.34 },
//   { id: "HUL", color: "#f3f4f6", progress: 0.36 },
//   { id: "LAW", color: "#1e3a8a", progress: 0.38 },
// ];

// const RaceTrack = () => {
//   const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
//   const trackRef = useRef<SVGPathElement>(null);

//   // 2. Race Loop: Advance every driver's progress
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setDrivers((prev) =>
//         prev.map((d) => ({
//           ...d,
//           // Small random variation to make it look like a real race
//           progress: (d.progress + (Math.random() * 0.002)) % 1
//         }))
//       );
//     }, 50);
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div className="w-full h-full flex items-center justify-center">
//       <div className="w-full h-full relative p-8">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
//           Live Simulator: Abu Dhabi
//         </h2>

//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full">
//           <path
//             ref={trackRef}
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="#404040"
//             strokeWidth="8"
//             fill="none"
//           />

//           {/* Render all 20 cars */}
//           {trackRef.current && drivers.map((d) => {
//             const point = trackRef.current!.getPointAtLength(d.progress * trackRef.current!.getTotalLength());
//             return (
//               <circle
//                 key={d.id}
//                 cx={point.x}
//                 cy={point.y}
//                 r="6"
//                 fill={d.color}
//                 stroke="#000"
//                 strokeWidth="1"
//                 className="transition-all duration-75 ease-linear"
//               />
//             );
//           })}
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;

// import { useRef } from "react";

// // The component now accepts data as props, making it a "dumb" presenter
// export interface RaceTrackProps {
//   drivers: { id: string; color: string }[];
//   positions: number[]; // Array of progress values (0.0 to 1.0) for each driver
// }

// const RaceTrack = ({ drivers, positions }: RaceTrackProps) => {
//   const trackRef = useRef<SVGPathElement>(null);

//   return (
//     <div className="w-full h-full flex items-center justify-center">
//       <div className="w-full h-full relative p-8">
//         <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
//           Live Simulator: Abu Dhabi
//         </h2>

//         <svg viewBox="0 0 439.42 499.5" className="w-full h-full">
//           <path
//             ref={trackRef}
//             d="m431.61 6.6182c-3.3477-4.0298-8.3958-2.341-41.441 9.8359-18.537 6.8309-39.522 14.534-46.634 17.116-7.1116 2.5826-13.552 5.0006-14.311 5.3739-0.75942 0.37338-21.89 8.2536-46.957 17.512-25.067 9.2579-62.517 23.092-83.223 30.742-20.706 7.6502-48.358 18.562-61.451 24.248-13.092 5.686-41.603 16.913-63.357 24.949-38.402 14.186-45.609 17.506-45.246 20.839 0.08851 0.81344 2.6604 4.3766 5.7142 7.9192 6.9717 8.0874 7.9848 11.134 5.0395 15.148-1.2214 1.6647-5.0006 6.7421-8.3986 11.284-19.024 25.427-25.312 40.312-26.306 62.281-0.93897 20.75-0.02187 110.59 1.2621 123.6 2.1666 21.963 3.0438 26.465 13.644 70.052 5.738 23.595 10.863 42.438 11.915 43.806 2.1716 2.8235 6.5319 4.3237 8.3297 2.8654 3.1293-2.5383 13.696-6.7883 15.911-6.3999 1.3467 0.2362 3.926 1.7796 5.7325 3.4305 2.0346 1.8595 4.5342 3.0918 6.5688 3.24 3.274 0.23845 3.3364 0.19418 19.903-14.184 15.838-13.746 16.628-14.566 16.839-17.468 0.4085-5.6089-1.4735-8.2319-14.155-19.727-20.688-18.752-52.986-48.829-54.687-50.927-2.4108-2.9722-3.8486-11.029-5.5777-31.265-1.2039-14.09-1.162-18.968 0.19135-22.233 1.9318-4.6602 17.809-25.225 22.204-28.759 1.5517-1.2483 3.5471-2.3552 4.4332-2.4592 1.0647-0.12495 5.2707 3.3344 12.403 10.2 12.627 12.155 16.401 14.979 19.278 14.426 2.4039-0.46254 26.683-21.342 28.631-24.621 1.7699-2.9798-0.14855-10.06-4.881-18.013-3.9813-6.691-5.4372-8.184-31.765-32.549-28.74-26.597-28.893-26.77-28.038-32.282 0.68926-4.4478 19.548-51.7 21.972-55.052 1.4532-2.0099 3.951-4.147 6.4612-5.5275 3.4946-1.9219 4.6021-2.0059 7.5817-0.57428 2.1302 1.0235 16.013 13.334 35.645 31.605 77.013 71.677 95.226 88.463 97.895 90.222 4.1039 2.7043 11.606 2.5116 15.183-0.38976 3.1204-2.531 37.322-46.725 43.104-55.697 5.5106-8.5514 5.4379-11.111-0.78195-27.56-2.9716-7.8583-5.9137-16.604-6.5392-19.434-2.3841-10.786 0.12005-23.821 6.5801-34.243 5.1419-8.295 10.915-12.391 27.932-19.822 24.28-10.603 36.497-19.201 54.123-38.088 5.2939-5.6728 10.884-11.62 12.422-13.216 25.575-26.551 24.555-24.949 21.171-33.26-1.4859-3.6501-2.5296-7.4967-2.3204-8.547 0.48007-2.4105 1.8869-3.0654 20.674-9.6272 20.249-7.0722 23.08-9.5947 18.738-16.705-0.48551-0.79518-0.92968-1.4887-1.4079-2.0644z"
//             stroke="#404040"
//             strokeWidth="8"
//             fill="none"
//           />

//           {/* Render cars using passed-in positions */}
//           {trackRef.current &&
//             drivers.map((d, index) => {
//               const progress = positions[index] || 0;
//               const point = trackRef.current!.getPointAtLength(
//                 progress * trackRef.current!.getTotalLength()
//               );
//               return (
//                 <circle
//                   key={d.id}
//                   cx={point.x}
//                   cy={point.y}
//                   r="6"
//                   fill={d.color}
//                   stroke="#000"
//                   strokeWidth="1"
//                   className="transition-all duration-100 ease-linear"
//                   style={{
//                     // Smooths out position updates perfectly to keep them locked to the track line
//                     transition: "cx 0.1s linear, cy 0.1s linear",
//                   }}
//                 />
//               );
//             })}
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default RaceTrack;\

import { useMemo } from "react";

export interface Driver {
  code: string;
  color: string;
}

export interface CarPosition {
  x: number;
  y: number;
  lap: number | null;
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface Bounds {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
}

export interface RaceTrackProps {
  drivers: Driver[];
  positions: Record<string, CarPosition>; // keyed by driver code, real x/y
  trackOutline: TrackPoint[];
  bounds: Bounds;
}

// Fixed SVG canvas size — we scale real-world coordinates INTO this box,
// rather than trying to align real data onto a fixed hand-drawn path.
const VIEWBOX_WIDTH = 800;
const VIEWBOX_HEIGHT = 600;
const PADDING = 40;

// Converts a real telemetry x/y (meters, arbitrary origin) into SVG
// viewBox space, preserving aspect ratio and centering the track.
// This single function is what replaces ALL the manual SVG alignment work —
// it works identically for every circuit because it's driven by that
// circuit's own bounds, not a fixed hand-tuned transform.
const makeProjector = (bounds: Bounds) => {
  const dataWidth = bounds.x_max - bounds.x_min || 1;
  const dataHeight = bounds.y_max - bounds.y_min || 1;

  const availableWidth = VIEWBOX_WIDTH - PADDING * 2;
  const availableHeight = VIEWBOX_HEIGHT - PADDING * 2;

  // Uniform scale (not stretched) so the track shape isn't distorted
  const scale = Math.min(availableWidth / dataWidth, availableHeight / dataHeight);

  const offsetX = PADDING + (availableWidth - dataWidth * scale) / 2;
  const offsetY = PADDING + (availableHeight - dataHeight * scale) / 2;

  return (x: number, y: number) => {
    const svgX = offsetX + (x - bounds.x_min) * scale;
    // Flip Y: telemetry Y typically increases "up", SVG Y increases "down"
    const svgY = offsetY + (dataHeight - (y - bounds.y_min)) * scale;
    return { x: svgX, y: svgY };
  };
};

const RaceTrack = ({ drivers, positions, trackOutline, bounds }: RaceTrackProps) => {
  const project = useMemo(() => makeProjector(bounds), [bounds]);

  // Build the track path ONCE from real telemetry points, not from a
  // downloaded/hand-aligned SVG. Closed loop back to the start point.
  const trackPathD = useMemo(() => {
    if (!trackOutline || trackOutline.length === 0) return "";
    const points = trackOutline.map((p) => project(p.x, p.y));
    const [first, ...rest] = points;
    const path = rest.reduce(
      (acc, p) => `${acc} L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
      `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
    );
    return `${path} Z`;
  }, [trackOutline, project]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full relative p-8">
        <h2 className="absolute top-4 left-4 text-xs font-bold text-red-500 uppercase tracking-widest z-10">
          Live Simulator
        </h2>
        <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full">
          <path d={trackPathD} stroke="#404040" strokeWidth="8" fill="none" strokeLinejoin="round" />

          {/* Cars plotted directly at their real (projected) coordinates —
              no getPointAtLength lookup, no progress-to-path guessing. */}
          {drivers.map((d) => {
            const pos = positions[d.code];
            if (!pos) return null; // driver not on track this frame

            const { x, y } = project(pos.x, pos.y);
            return (
              <circle
                key={d.code}
                cx={x}
                cy={y}
                r="6"
                fill={d.color}
                stroke="#000"
                strokeWidth="1"
                style={{
                  transition: "cx 0.1s linear, cy 0.1s linear",
                }}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default RaceTrack;
