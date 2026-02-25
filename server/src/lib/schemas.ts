import { z } from "zod";

export const AgentReportSchema = z.object({
    hostname: z.string(),
    ip_address: z.string().nullable().optional(),
    mac_address: z.string().nullable().optional(),
    os_version: z.string().nullable().optional(),
    department: z.string().nullable().optional(),

    cpu_usage: z.number(),
    cpu_cores: z.number().nullable().optional(),
    cpu_speed: z.string().nullable().optional(),
    cpu_temp: z.number().nullable().optional(),

    ram_total: z.number(),
    ram_used: z.number(),
    ram_usage: z.number(),

    disk_total: z.number(),
    disk_used: z.number(),
    disk_usage: z.number(),
    disk_details: z.any().nullable().optional(),

    network_up: z.boolean().default(true),
    network_info: z.any().nullable().optional(),

    os_info: z.any().nullable().optional(),
    uptime: z.number().nullable().optional(),

    top_processes: z.any().nullable().optional(),
    event_logs: z.any().nullable().optional(),
    software: z.any().nullable().optional(),
    antivirus_status: z.string().nullable().optional(),

    printers: z.any().nullable().optional(),
    windows_license: z.any().nullable().optional(),
    office_license: z.any().nullable().optional(),
    startup_programs: z.any().nullable().optional(),
    shared_folders: z.any().nullable().optional(),
    usb_devices: z.any().nullable().optional(),
    windows_update: z.any().nullable().optional(),
    services: z.any().nullable().optional(),

    // Advanced Monitoring (Phase 4)
    print_history: z.array(z.any()).nullable().optional(),
    bandwidth_usage: z.any().nullable().optional(),
    app_usage: z.any().nullable().optional(),
});

export const CommandResultSchema = z.object({
    success: z.boolean(),
    output: z.string().optional(),
});

export const AgentMessageSchema = z.object({
    hostname: z.string(),
    message: z.string(),
    department: z.string().optional(),
    ip_address: z.string().optional(),
});
