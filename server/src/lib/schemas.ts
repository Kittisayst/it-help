import { z } from "zod";

export const AgentReportSchema = z.object({
    hostname: z.string(),
    ip_address: z.string().optional(),
    mac_address: z.string().optional(),
    os_version: z.string().optional(),
    department: z.string().optional(),

    cpu_usage: z.number(),
    cpu_cores: z.number().optional(),
    cpu_speed: z.string().optional(),
    cpu_temp: z.number().optional(),

    ram_total: z.number(),
    ram_used: z.number(),
    ram_usage: z.number(),

    disk_total: z.number(),
    disk_used: z.number(),
    disk_usage: z.number(),
    disk_details: z.any().optional(),

    network_up: z.boolean().default(true),
    network_info: z.any().optional(),

    os_info: z.any().optional(),
    uptime: z.number().optional(),

    top_processes: z.any().optional(),
    event_logs: z.any().optional(),
    software: z.any().optional(),
    antivirus_status: z.string().optional(),

    printers: z.any().optional(),
    windows_license: z.any().optional(),
    office_license: z.any().optional(),
    startup_programs: z.any().optional(),
    shared_folders: z.any().optional(),
    usb_devices: z.any().optional(),
    windows_update: z.any().optional(),
    services: z.any().optional(),
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
