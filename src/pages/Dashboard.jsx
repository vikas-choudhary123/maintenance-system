import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  ArrowUpCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  DollarSign,
  BarChart2,
  Calendar,
  ThermometerSun,
} from "lucide-react";
import axios from "axios";



const Dashboard = () => {

  // const SCRIPT_URL =
  //   "https://script.google.com/macros/s/AKfycbzudKkY63zbthWP_YcfyF-HnUOObG_XM9aS2JDCmTmcYLaY1OQq7ho6i085BXxu9N2E7Q/exec";
  // const SHEET_NAME = "FormResponses";
  // const SHEET_Id = "15SBKzTJKzaqhjPI5yt5tKkrd3tzNuhm_Q9-iDO8n0B0";

  const [sheetDate, setSheetData] = useState([]);
const [maintenanceTasks, setMaintenanceTasks] = useState([]);
const [repairTasks, setRepairTasks] = useState([]);
const [totalMaintenanceTasksCompleted, setTotalMaintenanceTasksCompleted] = useState(0);
const [totalMaintenanceTasksOverdue, setTotalMaintenanceTasksOverdue] = useState(0);
const [totalRepairTasksCompleted, setTotalRepairTasksCompleted] = useState(0);
const [totalRepairTasksOverdue, setTotalRepairTasksOverdue] = useState(0);
const [repairCompletedTasks, setRepairCompletedTasks] = useState([]);
const [maintenanceCompletedTasks, setMaintenanceCompletedTasks] = useState([]);
const [maintenanceCostData, setMaintenanceCostData] = useState([]);
const [departmentCostData, setDepartmentCostData] = useState([]);
const [frequentRepairData, setFrequentRepairData] = useState([]);
const [totalCost, setTotalCost] = useState(0);

// const BACKEND_URL = "http://localhost:5050/api/dashboard";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;


useEffect(() => {
  const fetchDashboardData = async () => {
    try {
     const [statsRes, machineCostRes, deptRes, freqRes] = await Promise.all([
  axios.get(`${BACKEND_URL}/api/dashboard/stats`),
  axios.get(`${BACKEND_URL}/api/dashboard/maintenance-costs`),
  axios.get(`${BACKEND_URL}/api/dashboard/department-costs`),
  axios.get(`${BACKEND_URL}/api/dashboard/frequencies`)
]);


      const stats = statsRes.data.data;

      // ✅ Set summary metrics
      setSheetData(new Array(stats.total_machines).fill(0));
      setMaintenanceTasks(new Array(stats.total_tasks).fill(0));
      setTotalMaintenanceTasksCompleted(stats.completed_tasks);
      setTotalMaintenanceTasksOverdue(stats.overdue_tasks);
      setTotalCost(stats.total_maintenance_cost);

      // ✅ Chart data
      setMaintenanceCostData(machineCostRes.data.data);
      setDepartmentCostData(deptRes.data.data);
      setFrequentRepairData(freqRes.data.data);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  fetchDashboardData();
}, []);



  const formatSheetData = (sheetData) => {
    // Add null check to prevent the error
    if (!sheetData || !sheetData.cols || !sheetData.rows) {
      console.error("Invalid sheet data:", sheetData);
      return [];
    }

    const columns = sheetData.cols.map((col) => col.label);
    const rows = sheetData.rows;

    return rows.map((row) => {
      const obj = {};
      row.c.forEach((cell, i) => {
        obj[columns[i]] = cell?.v || ""; // Use raw value (not formatted version)
      });
      return obj;
    });
  };

  const getMaintenanceCostData = () => {
    // Create a map of machine names to their total maintenance costs
    // Only include tasks where both "Task Start Date" and "Actual Date" are not null
    const maintenanceCostsByMachine = {};

    maintenanceCompletedTasks.forEach((task) => {
      if (task["Serial No"] &&
        task["Maintenace Cost"] &&
        task["Task Start Date"] &&
        task["Actual Date"] &&
        task["Task Start Date"] !== "" &&
        task["Actual Date"] !== "") {
        const machineName = task["Serial No"];
        const maintenanceCost = parseFloat(task["Maintenace Cost"]) || 0;

        if (maintenanceCostsByMachine[machineName]) {
          maintenanceCostsByMachine[machineName] += maintenanceCost;
        } else {
          maintenanceCostsByMachine[machineName] = maintenanceCost;
        }
      }
    });

    // Convert to array format for chart
    return Object.keys(maintenanceCostsByMachine).map((machineName) => ({
      name: machineName,
      maintenanceCost: maintenanceCostsByMachine[machineName],
    }));
  };

  // const maintenanceCostData = getMaintenanceCostData();
  // console.log("repairVsPurchaseData", repairVsPurchaseData);

  // First, create a map to accumulate costs by department
  const departmentCostMap = {};

  // Process repair tasks
  repairCompletedTasks.forEach((task) => {
    const department = task.Department;
    const cost = task["Repair Cost"] || 0;

    if (!departmentCostMap[department]) {
      departmentCostMap[department] = 0;
    }
    departmentCostMap[department] += cost;
  });

  // Process maintenance tasks
  maintenanceCompletedTasks.forEach((task) => {
    const department = task.Department;
    const cost = task["Maintenace Cost"] || 0; // Note the typo in the field name

    if (!departmentCostMap[department]) {
      departmentCostMap[department] = 0;
    }
    departmentCostMap[department] += cost;
  });

  // Convert the map to the desired array format
  // const departmentCostData = Object.keys(departmentCostMap).map(
  //   (department) => ({
  //     name: department,
  //     cost: departmentCostMap[department],
  //   })
  // );

  // console.log('departmentCostData', departmentCostData);

  // Initialize an object to store counts for each frequency type
  const frequencyCounts = {
    "one-time": 0,
    daily: 0,
    weekly: 0,
    monthly: 0,
    quarterly: 0,
    "half-yearly": 0,
    yearly: 0,
  };

  // Count the occurrences of each frequency in maintenanceCompletedTasks
  maintenanceCompletedTasks.forEach((task) => {
    const frequency = task.Frequency;
    if (frequencyCounts.hasOwnProperty(frequency)) {
      frequencyCounts[frequency]++;
    }
  });

  // Convert to the desired array format
  // const frequentRepairData = Object.keys(frequencyCounts).map((frequency) => ({
  //   name: frequency,
  //   repairs: frequencyCounts[frequency],
  // }));

  // Calculate total cost from Maintenance Cost column (AD)
  const totalMaintenanceCost = maintenanceCompletedTasks.reduce((sum, task) => {
    return sum + (task["Maintenace Cost"] || 0);
  }, 0);

  const totalRepairCost = repairCompletedTasks.reduce((sum, task) => {
    return sum + (task["Repair Cost"] || 0);
  }, 0);




  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        {/* <div className="flex space-x-2">
          <select className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="lastQuarter">Last Quarter</option>
            <option value="thisYear">This Year</option>
          </select>
        </div> */}
      </div>

      {/* Summary Stats for maintenance */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-1 rounded-full bg-blue-100 mr-4">
            <Wrench size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Machines</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {sheetDate?.length}
            </h3>
            {/* <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1" />
              <span>+12 this month</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-1 rounded-full bg-indigo-100 mr-4">
            <Calendar size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Tasks
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {maintenanceTasks?.length}
            </h3>
            {/* <p className="text-xs text-amber-600 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              <span>42 scheduled today</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-1 rounded-full bg-green-100 mr-4">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Tasks Complete
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalMaintenanceTasksCompleted}
            </h3>
            {/* <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1" />
              <span>+23% from last month</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-1 rounded-full bg-amber-100 mr-4">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Tasks Pending
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {maintenanceTasks.length - totalMaintenanceTasksCompleted}
            </h3>
            {/* <p className="text-xs text-amber-600 flex items-center mt-1">
              <AlertTriangle size={14} className="mr-1" />
              <span>8 due today</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-1 rounded-full bg-red-100 mr-4">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Tasks Overdue
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalMaintenanceTasksOverdue}
            </h3>
            {/* <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>+5 this week</span>
            </p> */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-1 rounded-full bg-purple-100 mr-4">
            <DollarSign size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cost</p>
            <h3 className="text-2xl font-bold text-gray-800">₹{totalCost.toLocaleString()}</h3>
            {/* <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>-5% vs budget</span>
            </p> */}
          </div>
        </div>
      </div>

      {/* Summary Stats for repair */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        
       
        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-indigo-100 mr-4">
            <Calendar size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">
              Total Repair Tasks
            </p>
            <h3 className="text-2xl font-bold text-gray-800">{repairTasks?.length}</h3>
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <Clock size={14} className="mr-1" />
              <span>42 scheduled today</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-green-100 mr-4">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Repair Tasks Complete</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalRepairTasksCompleted}</h3>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1" />
              <span>+23% from last month</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-amber-100 mr-4">
            <Clock size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Repair Tasks Pending</p>
            <h3 className="text-2xl font-bold text-gray-800">{repairTasks.length - totalMaintenanceTasksCompleted}</h3>
            <p className="text-xs text-amber-600 flex items-center mt-1">
              <AlertTriangle size={14} className="mr-1" />
              <span>8 due today</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-red-100 mr-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Repair Tasks Overdue</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalRepairTasksOverdue}</h3>
            <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>+5 this week</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 flex items-start">
          <div className="p-3 rounded-full bg-purple-100 mr-4">
            <DollarSign size={24} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cost</p>
            <h3 className="text-2xl font-bold text-gray-800">₹36,450</h3>
            <p className="text-xs text-red-600 flex items-center mt-1">
              <ArrowUpCircle size={14} className="mr-1 transform rotate-180" />
              <span>-5% vs budget</span>
            </p>
          </div>
        </div>
      </div> */}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <BarChart2 size={20} className="mr-2 text-indigo-600" />
              Maintenance Cost
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar
                  dataKey="maintenanceCost"
                  name="Maintenance Cost"
                  fill="#4F46E5"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <DollarSign size={20} className="mr-2 text-indigo-600" />
              Department Cost Analysis
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentCostData}
                  dataKey="cost"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {departmentCostData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        ["#4F46E5", "#60A5FA", "#F59E0B", "#10B981"][index % 4]
                      }
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <ThermometerSun size={20} className="mr-2 text-indigo-600" />
              Temperature Readings
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureReadings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="HP102"
                  name="HP-102"
                  stroke="#4F46E5"
                />
                <Line
                  type="monotone"
                  dataKey="CNC305"
                  name="CNC-305"
                  stroke="#F59E0B"
                />
                <Line
                  type="monotone"
                  dataKey="CB201"
                  name="CB-201"
                  stroke="#10B981"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div> */}

        <div className="bg-white rounded-xl shadow p-6 col-span-1 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Wrench size={20} className="mr-2 text-indigo-600" />
              Frequent Maintenance
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequentRepairData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="repairs"
                  name="Number of Repairs"
                  fill="#EF4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {/* <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            Recent Maintenance Activities
          </h2>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex items-start pb-4 border-b border-gray-100"
            >
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                <Wrench size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Hydraulic Press #HP-{item + 100} Maintenance
                  </p>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Scheduled maintenance completed by John Doe
                </p>
                <div className="mt-2 flex items-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Completed
                  </span>
                  <span className="ml-2 text-xs text-gray-500">Cost: ₹420</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;