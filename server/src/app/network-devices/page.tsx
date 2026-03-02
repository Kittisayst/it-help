"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Wifi,
  Router,
  Monitor,
  Smartphone,
  Printer,
  Server,
  HardDrive,
  X,
  Edit2,
  Trash2,
  Globe,
  Radar,
  RefreshCw,
  Settings,
  Loader2,
  Check,
} from "lucide-react";

interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string | null;
  type: string;
  brand: string | null;
  model: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  autoDiscovered: boolean;
  vendor: string | null;
  lastSeenAt: string;
  createdAt: string;
}

interface DiscoveredDevice {
  id: string;
  ipAddress: string;
  macAddress: string | null;
  vendor: string | null;
  status: string;
  guessedType: string;
  firstSeenAt: string;
  lastSeenAt: string;
  scanCount: number;
  isSaved: boolean;
}

interface ScanConfig {
  id: string;
  subnet: string;
  enabled: boolean;
}

const DEVICE_TYPES = [
  { value: "router", label: "Router", icon: Router },
  { value: "access_point", label: "Access Point", icon: Wifi },
  { value: "switch", label: "Switch", icon: HardDrive },
  { value: "pc", label: "PC / Desktop", icon: Monitor },
  { value: "laptop", label: "Laptop", icon: Monitor },
  { value: "mobile", label: "Mobile", icon: Smartphone },
  { value: "printer", label: "Printer", icon: Printer },
  { value: "server", label: "Server", icon: Server },
  { value: "other", label: "ອື່ນໆ", icon: Globe },
];

const STATUS_OPTIONS = [
  { value: "online", label: "ອອນລາຍ" },
  { value: "offline", label: "ອອບລາຍ" },
  { value: "unknown", label: "ບໍ່ຮູ້" },
];

const getDeviceIcon = (type: string) => {
  return DEVICE_TYPES.find((t) => t.value === type)?.icon || Globe;
};

const getDeviceTypeLabel = (type: string) => {
  return DEVICE_TYPES.find((t) => t.value === type)?.label || type;
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case "online":
      return { label: "ອອນລາຍ", color: "bg-green-500" };
    case "offline":
      return { label: "ອອບລາຍ", color: "bg-red-500" };
    default:
      return { label: "ບໍ່ຮູ້", color: "bg-gray-500" };
  }
};

export default function NetworkDevicesPage() {
  const [activeTab, setActiveTab] = useState<"discovered" | "saved">("discovered");
  
  // Discovered devices state
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [selectedDiscovered, setSelectedDiscovered] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [showAllDiscovered, setShowAllDiscovered] = useState(false);
  const [recentHours, setRecentHours] = useState(24);
  
  // Saved devices state
  const [savedDevices, setSavedDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Scan config state
  const [scanConfigs, setScanConfigs] = useState<ScanConfig[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newSubnet, setNewSubnet] = useState("");
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDevice, setEditDevice] = useState<NetworkDevice | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    macAddress: "",
    type: "router",
    brand: "",
    model: "",
    location: "",
    status: "online",
    notes: "",
  });

  // Fetch scan configs
  const fetchScanConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/network-scan-config");
      const json = await res.json();
      setScanConfigs(json);
    } catch {
      console.error("Failed to fetch scan configs");
    }
  }, []);

  // Fetch discovered devices from database
  const fetchDiscoveredDevices = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        showAll: showAllDiscovered.toString(),
        onlyUnsaved: "true",
        recentHours: recentHours.toString(),
      });
      const res = await fetch(`/api/discovered-devices?${params}`);
      const json = await res.json();
      setDiscoveredDevices(json.data || []);
    } catch {
      console.error("Failed to fetch discovered devices");
    }
  }, [showAllDiscovered, recentHours]);

  // Fetch saved devices
  const fetchSavedDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "1000" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/network-devices?${params}`);
      const json = await res.json();
      setSavedDevices(json.data || []);
    } catch {
      console.error("Failed to fetch saved devices");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  // Scan network
  const scanNetwork = useCallback(async () => {
    setScanning(true);
    setSelectedDiscovered(new Set());
    
    try {
      const enabledSubnets = scanConfigs.filter((c) => c.enabled);
      if (enabledSubnets.length === 0) {
        alert("ກະລຸນາຕັ້ງຄ່າ subnet ກ່ອນ");
        setScanning(false);
        return;
      }

      for (const config of enabledSubnets) {
        await fetch("/api/network-devices/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subnet: config.subnet }),
        });
      }

      setLastScanTime(new Date());
      
      // Fetch updated discovered devices from database
      await fetchDiscoveredDevices();
    } catch (error) {
      console.error("Failed to scan network:", error);
    } finally {
      setScanning(false);
    }
  }, [scanConfigs, fetchDiscoveredDevices]);

  // Save selected discovered devices
  const saveSelectedDevices = useCallback(async () => {
    const selected = discoveredDevices.filter((d) => selectedDiscovered.has(d.id));
    if (selected.length === 0) {
      alert("ກະລຸນາເລືອກອຸປະກອນກ່ອນ");
      return;
    }

    try {
      for (const device of selected) {
        await fetch("/api/network-devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: device.vendor
              ? `${device.vendor} (${device.ipAddress})`
              : `Device ${device.ipAddress}`,
            ipAddress: device.ipAddress,
            macAddress: device.macAddress,
            type: device.guessedType,
            brand: device.vendor || null,
            status: "online",
            autoDiscovered: true,
            vendor: device.vendor,
          }),
        });
      }
      
      // Mark devices as saved in discovered_device table
      await fetch("/api/discovered-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceIds: Array.from(selectedDiscovered) }),
      });
      
      setSelectedDiscovered(new Set());
      
      // Refresh both lists
      fetchDiscoveredDevices();
      fetchSavedDevices();
      
      alert(`ບັນທຶກສຳເລັດ ${selected.length} ອຸປະກອນ`);
    } catch {
      console.error("Failed to save devices");
      alert("ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ");
    }
  }, [discoveredDevices, selectedDiscovered, fetchDiscoveredDevices, fetchSavedDevices]);

  // Add subnet config
  const addSubnetConfig = async () => {
    if (!newSubnet) return;
    try {
      await fetch("/api/network-scan-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subnet: newSubnet, enabled: true }),
      });
      setNewSubnet("");
      fetchScanConfigs();
    } catch {
      console.error("Failed to add subnet config");
    }
  };

  // Delete subnet config
  const deleteSubnetConfig = async (id: string) => {
    try {
      await fetch(`/api/network-scan-config/${id}`, { method: "DELETE" });
      fetchScanConfigs();
    } catch {
      console.error("Failed to delete subnet config");
    }
  };

  // Toggle subnet enabled
  const toggleSubnetEnabled = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/network-scan-config/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      fetchScanConfigs();
    } catch {
      console.error("Failed to update subnet config");
    }
  };

  // Delete saved device
  const handleDelete = async (id: string) => {
    if (!confirm("ທ່ານຕ້ອງການລຶບອຸປະກອນນີ້ແທ້ບໍ?")) return;
    try {
      await fetch(`/api/network-devices/${id}`, { method: "DELETE" });
      fetchSavedDevices();
    } catch {
      console.error("Failed to delete device");
    }
  };

  // Edit device
  const openEditModal = (device: NetworkDevice) => {
    setEditDevice(device);
    setFormData({
      name: device.name,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress || "",
      type: device.type,
      brand: device.brand || "",
      model: device.model || "",
      location: device.location || "",
      status: device.status,
      notes: device.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.ipAddress || !formData.type) return;

    try {
      await fetch(`/api/network-devices/${editDevice?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowEditModal(false);
      fetchSavedDevices();
    } catch {
      console.error("Failed to save device");
    }
  };

  // Toggle select discovered device
  const toggleSelectDevice = (id: string) => {
    setSelectedDiscovered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDiscovered.size === discoveredDevices.length) {
      setSelectedDiscovered(new Set());
    } else {
      setSelectedDiscovered(new Set(discoveredDevices.map((d) => d.id)));
    }
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === "discovered" && !scanning) {
        scanNetwork();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [activeTab, scanning, scanNetwork]);

  // Initial load
  useEffect(() => {
    fetchScanConfigs();
    fetchDiscoveredDevices();
    fetchSavedDevices();
  }, [fetchScanConfigs, fetchDiscoveredDevices, fetchSavedDevices]);

  // Refresh discovered devices when filters change
  useEffect(() => {
    if (activeTab === "discovered") {
      fetchDiscoveredDevices();
    }
  }, [activeTab, showAllDiscovered, recentHours, fetchDiscoveredDevices]);

  // Auto-scan on mount if configs exist
  useEffect(() => {
    if (scanConfigs.length > 0 && discoveredDevices.length === 0 && !scanning) {
      scanNetwork();
    }
  }, [scanConfigs]); // Only run when scanConfigs changes

  const filteredSavedDevices = savedDevices.filter((device) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        device.name.toLowerCase().includes(searchLower) ||
        device.ipAddress.includes(searchLower) ||
        device.macAddress?.toLowerCase().includes(searchLower) ||
        device.vendor?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            ອຸປະກອນເຄືອຂ່າຍ
          </h1>
          <p className="text-sm text-muted mt-1">
            ສະແກນ ແລະ ຈັດການອຸປະກອນພາຍໃນເຄືອຂ່າຍ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            ຕັ້ງຄ່າ Subnet
          </button>
          {activeTab === "discovered" && (
            <button
              onClick={scanNetwork}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  ກຳລັງສະແກນ...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("discovered")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "discovered"
              ? "text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4" />
            ລາຍການສະແກນ
            {discoveredDevices.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {discoveredDevices.length}
              </span>
            )}
          </div>
          {activeTab === "discovered" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === "saved"
              ? "text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            ລາຍການບັນທຶກ
            {savedDevices.length > 0 && (
              <span className="px-2 py-0.5 bg-accent text-white text-xs rounded-full">
                {savedDevices.length}
              </span>
            )}
          </div>
          {activeTab === "saved" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      </div>

      {/* Discovered Tab */}
      {activeTab === "discovered" && (
        <div className="space-y-4">
          {/* Filter controls */}
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAllDiscovered}
                  onChange={(e) => setShowAllDiscovered(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-foreground">ສະແດງທັງໝົດ</span>
              </label>
              {!showAllDiscovered && (
                <select
                  value={recentHours}
                  onChange={(e) => setRecentHours(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-background border border-border rounded text-sm text-foreground"
                >
                  <option value="1">1 ຊົ່ວໂມງລ່າສຸດ</option>
                  <option value="6">6 ຊົ່ວໂມງລ່າສຸດ</option>
                  <option value="24">24 ຊົ່ວໂມງລ່າສຸດ</option>
                  <option value="72">3 ມື້ລ່າສຸດ</option>
                  <option value="168">7 ມື້ລ່າສຸດ</option>
                </select>
              )}
            </div>
            {lastScanTime && (
              <span className="text-sm text-muted">
                ສະແກນຄັ້ງລ່າສຸດ: {lastScanTime.toLocaleTimeString("lo-LA")} · Auto-refresh ທຸກ 5 ນາທີ
              </span>
            )}
          </div>

          {scanning && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-muted">ກຳລັງສະແກນເຄືອຂ່າຍ...</p>
              <p className="text-xs text-muted mt-1">
                Scanning {scanConfigs.filter((c) => c.enabled).length} subnet(s)
              </p>
            </div>
          )}

          {!scanning && discoveredDevices.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Radar className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted">ບໍ່ພົບອຸປະກອນໃໝ່</p>
              <p className="text-xs text-muted mt-1">
                ກົດ Refresh ເພື່ອສະແກນອີກຄັ້ງ
              </p>
            </div>
          )}

          {!scanning && discoveredDevices.length > 0 && (
            <>
              {/* Actions bar */}
              <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-accent hover:underline"
                  >
                    {selectedDiscovered.size === discoveredDevices.length
                      ? "ຍົກເລີກທັງໝົດ"
                      : "ເລືອກທັງໝົດ"}
                  </button>
                  <span className="text-sm text-muted">
                    ເລືອກ {selectedDiscovered.size} / {discoveredDevices.length}
                  </span>
                </div>
                <button
                  onClick={saveSelectedDevices}
                  disabled={selectedDiscovered.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  ບັນທຶກທີ່ເລືອກ ({selectedDiscovered.size})
                </button>
              </div>

              {/* Table */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/5 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">
                        <input
                          type="checkbox"
                          checked={selectedDiscovered.size === discoveredDevices.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                        IP Address
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                        MAC Address
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                        Vendor
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                        ປະເພດ
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                        ສະຖານະ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoveredDevices.map((device) => {
                      const Icon = getDeviceIcon(device.guessedType);
                      const isSelected = selectedDiscovered.has(device.id);
                      return (
                        <tr
                          key={device.id}
                          onClick={() => toggleSelectDevice(device.id)}
                          className={`border-b border-border cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-500/10" : "hover:bg-muted/5"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectDevice(device.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-foreground">
                              {device.ipAddress}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-muted">
                              {device.macAddress || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-blue-400">
                              {device.vendor || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-accent" />
                              <span className="text-sm text-foreground">
                                {getDeviceTypeLabel(device.guessedType)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs text-muted">ອອນລາຍ</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="ຄົ້ນຫາ IP, MAC, ຊື່, Vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">ທຸກປະເພດ</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">ທຸກສະຖານະ</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
            </div>
          ) : filteredSavedDevices.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <HardDrive className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted">ບໍ່ມີອຸປະກອນທີ່ບັນທຶກ</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/5 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      ຊື່
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      MAC Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      ປະເພດ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      ສະຖານະ
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                      ສະຖານທີ່
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-foreground">
                      ຈັດການ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSavedDevices.map((device) => {
                    const Icon = getDeviceIcon(device.type);
                    const statusInfo = getStatusInfo(device.status);
                    return (
                      <tr
                        key={device.id}
                        className="border-b border-border hover:bg-muted/5"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-accent" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {device.name}
                                </span>
                                {device.autoDiscovered && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                                    ອັດຕະໂນມັດ
                                  </span>
                                )}
                              </div>
                              {device.vendor && (
                                <span className="text-xs text-blue-400">
                                  {device.vendor}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-foreground">
                            {device.ipAddress}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted">
                            {device.macAddress || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground">
                            {getDeviceTypeLabel(device.type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                            <span className="text-xs text-muted">
                              {statusInfo.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted">
                            {device.location || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(device)}
                              className="p-1.5 text-muted hover:text-accent transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(device.id)}
                              className="p-1.5 text-muted hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subnet Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                ຕັ້ງຄ່າ Subnet ສຳລັບສະແກນ
              </h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Add new subnet */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ເພີ່ມ Subnet ໃໝ່
                  </label>
                  <input
                    type="text"
                    value={newSubnet}
                    onChange={(e) => setNewSubnet(e.target.value)}
                    placeholder="192.168.1"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button
                  onClick={addSubnetConfig}
                  disabled={!newSubnet}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* List of subnets */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Subnet ທີ່ຕັ້ງຄ່າ
                </label>
                {scanConfigs.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">
                    ຍັງບໍ່ມີການຕັ້ງຄ່າ subnet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {scanConfigs.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) =>
                              toggleSubnetEnabled(config.id, e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                          <span className="font-mono text-sm text-foreground">
                            {config.subnet}.0/24
                          </span>
                        </div>
                        <button
                          onClick={() => deleteSubnetConfig(config.id)}
                          className="p-1 text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Device Modal */}
      {showEditModal && editDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                ແກ້ໄຂອຸປະກອນ
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ຊື່ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    IP Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ipAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, ipAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    MAC Address
                  </label>
                  <input
                    type="text"
                    value={formData.macAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, macAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ປະເພດ <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {DEVICE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ຍີ່ຫໍ້
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ລຸ້ນ
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ສະຖານທີ່
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    ສະຖານະ
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  ໝາຍເຫດ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                ຍົກເລີກ
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.ipAddress || !formData.type}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                ບັນທຶກ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
