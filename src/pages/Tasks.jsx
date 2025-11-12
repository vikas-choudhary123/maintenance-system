import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import {
  Search,
  Filter,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  FileText,
  UserCircle,
} from "lucide-react";
import axios from "axios";

const Tasks = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [repairTasks, setRepairTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("maintenance");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [error, setError] = useState(null);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzudKkY63zbthWP_YcfyF-HnUOObG_XM9aS2JDCmTmcYLaY1OQq7ho6i085BXxu9N2E7Q/exec";
  const SHEET_Id = "15SBKzTJKzaqhjPI5yt5tKkrd3tzNuhm_Q9-iDO8n0B0";

  // Fetch departments from Master sheet column B
  // Fetch departments from backend API
  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await axios.get("http://localhost:5050/api/departments");
      const departments = response.data;
      
      if (departments && departments.length > 0) {
        const uniqueDepartments = [...new Set(departments)].sort();
        setDepartmentOptions(uniqueDepartments);
        console.log('Fetched departments:', uniqueDepartments);
      } else {
        console.warn('No department data found');
        setDepartmentOptions([]);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartmentOptions([]);
    } finally {
      setLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

useEffect(() => {
  const fetchTasks = async () => {
    setLoadingTasks(true);
    setError(null);

    try {
      // Fetch pending tasks from your backend
      const pendingTasksResponse = await axios.get("http://localhost:5050/api/tasks/pending");
      const responseData = pendingTasksResponse.data;

      console.log('Full backend response:', responseData);

      // Handle different response formats
      let pendingTasks = [];
      
      if (Array.isArray(responseData)) {
        // If response is directly an array
        pendingTasks = responseData;
      } else if (responseData && Array.isArray(responseData.tasks)) {
        // If response has a tasks property that is an array
        pendingTasks = responseData.tasks;
      } else if (responseData && Array.isArray(responseData.data)) {
        // If response has a data property that is an array
        pendingTasks = responseData.data;
      } else if (responseData && typeof responseData === 'object') {
        // If it's a single task object, wrap it in an array
        pendingTasks = [responseData];
      }

      console.log('Processed pending tasks:', pendingTasks);

      if (pendingTasks && pendingTasks.length > 0) {
        // Transform backend data to match frontend format
        const formattedTasks = pendingTasks.map(task => ({
          "Task No": task.task_no || task.taskNo || task["Task_No"] || "N/A",
          "Serial No": task.serial_no || task.serialNo || task["Serial_No"] || "N/A",
          "Machine Name": task.machine_name || task.machineName || task["Machine_Name"] || "N/A",
          "Department": task.department || "N/A",
          "Doer Name": task.doer_name || task.doerName || task["Doer_Name"] || "Unassigned",
          "Priority": task.priority || "N/A",
          "Task Type": task.task_type || task.taskType || task["Task_Type"] || "N/A",
          "Task Status": task.task_status || task.taskStatus || task["Task_Status"] || "N/A",
          "Task Start Date": task.task_start_date || task.taskStartDate || task["Task_Start_Date"] || "N/A",
          "Actual Date": task.actual_date || task.actualDate || task["Actual_Date"] || "",
          "Description": task.description || "",
          "Given By": task.given_by || task.givenBy || task["Given_By"] || "N/A",
          "Location": task.location || "N/A"
        }));

        setMaintenanceTasks(formattedTasks);
        setRepairTasks([]);
      } else {
        console.warn('No pending tasks received from backend');
        setMaintenanceTasks([]);
        setRepairTasks([]);
      }

    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(`Failed to load tasks: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoadingTasks(false);
    }
  };

  fetchTasks();
}, []);

  const formatSheetData = (sheetData) => {
    console.log('Processing sheet data:', sheetData);

    // Add safety checks
    if (!sheetData || !sheetData.cols || !sheetData.rows) {
      console.warn('Invalid sheet data structure:', sheetData);
      return [];
    }

    const columns = sheetData.cols.map((col) => col?.label);
    const rows = sheetData.rows;

    if (!columns || columns.length === 0) {
      console.warn('No columns found in sheet data');
      return [];
    }

    return rows.map((row) => {
      const obj = {};
      if (row && row.c) {
        row.c.forEach((cell, i) => {
          if (columns[i]) {
            obj[columns[i]] = cell?.v || "";
          }
        });
      }
      return obj;
    }).filter(obj => Object.keys(obj).length > 0); // Filter out empty objects
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const rawTasks = activeTab === "maintenance" ? maintenanceTasks : repairTasks;

  const filteredTasks = rawTasks.filter((task) => {
    if (!task) return false;

    const departmentMatch =
      selectedDepartment === "all" ||
      task["Department"]?.toLowerCase() === selectedDepartment.toLowerCase();

    const searchMatch =
      task["Machine Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Task Type"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Serial No"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Priority"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Department"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Doer Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task["Location"]
        ?.toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return departmentMatch && searchMatch;
  });

  const getFirstPendingOrLatestCompletedPerMachineAndSerial = (tasks) => {
    if (!tasks || !Array.isArray(tasks)) {
      console.warn('Invalid tasks array provided to processing function');
      return [];
    }

    const machineSerialMap = new Map();

    tasks.forEach((task) => {
      if (!task) return; // Skip null/undefined tasks

      const machineName = task["Machine Name"];
      const serialNo = task["Serial No"];
      const actualDate = task["Actual Date"];

      // Skip tasks without essential data
      if (!machineName || !serialNo) return;

      // Create unique key combining machine name and serial number
      const uniqueKey = `${machineName}|${serialNo}`;

      if (!machineSerialMap.has(uniqueKey)) {
        if (!actualDate) {
          // If not completed (pending), keep the first pending
          machineSerialMap.set(uniqueKey, task);
        } else {
          // Temporarily store the first completed
          machineSerialMap.set(uniqueKey, { ...task, __isCompleted: true });
        }
      } else {
        const existing = machineSerialMap.get(uniqueKey);

        // If we already have a pending one, skip
        if (!existing["Actual Date"]) return;

        // If existing is completed but current is pending, replace it
        if (actualDate === "") {
          machineSerialMap.set(uniqueKey, task);
        }
      }
    });

    return Array.from(machineSerialMap.values());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Maintenance Tasks</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-500 mr-2" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={loadingDepartments}
            >
              <option value="all">All Departments</option>
              {loadingDepartments ? (
                <option>Loading departments...</option>
              ) : (
                departmentOptions.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "maintenance"
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance ({maintenanceTasks.length})
        </button>
        {/* Repair button hidden as requested */}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table heading - fixed */}
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[200px]"
                  onClick={() => handleSort("machineName")}
                >
                  <div className="flex items-center">
                    Machine & Task
                    {sortColumn === "machineName" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[120px]"
                  onClick={() => handleSort("serialNo")}
                >
                  <div className="flex items-center">
                    Serial No
                    {sortColumn === "serialNo" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[150px]"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center">
                    Department
                    {sortColumn === "department" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]"
                >
                  Priority
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer min-w-[180px]"
                  onClick={() => handleSort("assignedTo")}
                >
                  <div className="flex items-center">
                    Assigned To
                    {sortColumn === "assignedTo" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                >
                  Location
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table body with scroll */}
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task, ind) => (
                <tr key={`${task["Machine Name"]}-${task["Serial No"]}-${ind}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="text-sm font-medium text-gray-900">
                      {task["Machine Name"] || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task["Task Type"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[120px]">
                    <div className="text-sm text-gray-900">
                      {task["Serial No"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[150px]">
                    <div className="text-sm text-gray-900">
                      {task["Department"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[120px]">
                    <div className="flex flex-col space-y-1">
                      {task["Priority"] || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[180px]">
                    <div className="flex items-center">
                      <UserCircle size={20} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {task["Doer Name"] || "Unassigned"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="text-sm text-gray-900 break-words">
                      {task["Location"] || "N/A"}
                    </div>
                    {task.vendor && (
                      <div className="text-xs text-gray-500 break-words">
                        {task.vendor}
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 min-w-[100px]">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/tasks/${encodeURIComponent(
                          task["Task No"] || "unknown"
                        )}/${encodeURIComponent(task["Serial No"] || "unknown")}/${encodeURIComponent(task["Task Type"] || "unknown")}`}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      >
                        <FileText size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loadingTasks ? (
          <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
            <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 && !error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No tasks found matching your criteria.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Tasks;