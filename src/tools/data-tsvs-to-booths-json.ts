import { existsSync, readFileSync, writeFileSync } from "fs";
import minimist from 'minimist';
import { Booth } from "../types/Booth.js";
const argv = minimist(process.argv.slice(2));
console.log("Arguments:", argv);

try {

    const eventId = argv.eventId;
    if (!eventId) {
        console.error("Please provide an event ID using --eventId");
        process.exit(1);
    }
    
    const currentDirectory = process.cwd();
    if (!existsSync(`${currentDirectory}/data/events/${eventId}`)) {
        console.error(`Event ID ${eventId} does not exist in the data directory.`);
        process.exit(1);
    }
    console.log("Current directory:", currentDirectory);
    console.log("Event ID:", eventId);
    
    const attendanceTsvPath = `${currentDirectory}/data/events/${eventId}/attendance.tsv`;
    const linksTsvPath = `${currentDirectory}/data/events/${eventId}/links.tsv`;
    const tagsTsvPath = `${currentDirectory}/data/events/${eventId}/tags.tsv`;
    if (!existsSync(attendanceTsvPath)) {
        console.error(`Attendance TSV file does not exist at path: ${attendanceTsvPath}`);
        process.exit(1);
    }
    if (!existsSync(linksTsvPath)) {
        console.error(`Links CSV file does not exist at path: ${linksTsvPath}`);
        process.exit(1);
    }
    if (!existsSync(tagsTsvPath)) {
        console.error(`Tags CSV file does not exist at path: ${tagsTsvPath}`);
        process.exit(1);
    }

    const attendanceTsv = readFileSync(attendanceTsvPath, 'utf-8');
    const linksCsv = readFileSync(linksTsvPath, 'utf-8');
    const tagsCsv = readFileSync(tagsTsvPath, 'utf-8');

    // Map: circle name -> Booth
    const boothsMap: Map<string, Booth> = new Map();

    const attendanceLines = attendanceTsv.replaceAll('\r','').split('\n').slice(1);
    attendanceLines.forEach(line => {
        const [idString, circleString, artist, coverImageNameString, ...attendanceColumns] = line.split('\t');
        const id = parseInt(idString, 10);
        if (isNaN(id)) {
            return;
        }
        const circle = circleString.trim();
        const coverImageName = coverImageNameString.trim();
        const booth: Booth = {
            id,
            circle,
            attendance: [],
            coverImageName,
            links: [],
            tags: []
        }
        for (let i = 0; i < attendanceColumns.length; i += 2) {
            const day = i/2 + 1;
            if (attendanceColumns[i] === '') {
                continue;
            }
            const location = attendanceColumns[i].trim();
            const isBorrowed = attendanceColumns[i + 1].trim() === 'TRUE';
            booth.attendance = [...booth.attendance, { day, location, isBorrowed }];
        }
        boothsMap.set(booth.circle, booth);
    });

    const linksLines = linksCsv.replaceAll('\r','').split('\n').slice(1);
    linksLines.forEach(line => {
        const [circle, name, category, url] = line.split('\t');
        const booth = boothsMap.get(circle.trim());
        if (!booth) {
            console.warn(`Booth with circle "${circle}" not found in attendance data while processing its link entry.`);
            return;
        }
        if (name.trim() === '' || category.trim() === '' || url.trim() === '') {
            return;
        }
        booth.links.push({ 
            name: name.trim(), 
            category: category.trim(),
            url: url.trim()
        });
    });

    const tagsLines = tagsCsv.replaceAll('\r','').split('\n').slice(1);
    tagsLines.forEach(line => {
        const [circle, tag] = line.split('\t');
        const booth = boothsMap.get(circle.trim());
        if (!booth) {
            console.warn(`Booth with circle "${circle}" not found in attendance data while processing its tag entry.`);
            return;
        }
        if (tag.trim() === '') {
            return;
        }
        booth.tags.push(tag.trim());
    });

    writeFileSync(`${currentDirectory}/data/events/${eventId}/booths.json`, JSON.stringify(Array.from(boothsMap.values()), null, 2));
    console.log(`Booths data written to ${currentDirectory}/data/events/${eventId}/booths.json`);

} catch (error) {

    console.error("Something went wrong:", error);
    process.exit(1);

}
