from datetime import datetime, timedelta

def parse_time(time_str):
    return datetime.strptime(time_str, "%H:%M")

def detect_conflicts(events):
    events.sort(key=lambda x: parse_time(x[1]))
    sorted_schedule = []
    conflicts = []

    for i in range(len(events)):
        sorted_schedule.append(events[i])
        for j in range(i):
            if parse_time(events[i][1]) < parse_time(events[j][2]):
                conflicts.append((events[i][0], events[j][0]))

    return sorted_schedule, conflicts

def suggest_resolutions(conflicts, events):
    resolutions = []
    for conflict in conflicts:
        for event in events:
            if event[0] == conflict[0]:
                duration = parse_time(event[2]) - parse_time(event[1])
                new_start = parse_time(event[2]) + timedelta(hours=1)
                new_end = new_start + duration
                resolutions.append((event[0], new_start.strftime("%H:%M"), new_end.strftime("%H:%M")))
                break
    return resolutions

# Input Section
n = int(input("Enter number of events: "))
events = []
for _ in range(n):
    name = input("Enter event name: ")
    start_time = input("Enter start time (HH:MM): ")
    end_time = input("Enter end time (HH:MM): ")
    events.append((name, start_time, end_time))

# Processing
sorted_schedule, conflicts = detect_conflicts(events)
resolutions = suggest_resolutions(conflicts, events)

# Output
print("\nSorted Schedule:")
for event in sorted_schedule:
    print(f"{event[0]}, Start: {event[1]}, End: {event[2]}")

print("\nConflicting Events:")
for conflict in conflicts:
    print(f"{conflict[0]} and {conflict[1]}")

print("\nSuggested Resolutions:")
for resolution in resolutions:
    print(f"Reschedule \"{resolution[0]}\" to Start: {resolution[1]}, End: {resolution[2]}")
