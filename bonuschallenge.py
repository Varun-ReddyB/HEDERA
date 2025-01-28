import tkinter as tk
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

def suggest_resolutions(conflicts, events, working_hours):
    resolutions = []
    for conflict in conflicts:
        for event in events:
            if event[0] == conflict[0]:
                duration = parse_time(event[2]) - parse_time(event[1])
                new_start = parse_time(event[2]) + timedelta(hours=1)
                new_end = new_start + duration
                if working_hours[0] <= new_start.time() <= working_hours[1]:
                    resolutions.append((event[0], new_start.strftime("%H:%M"), new_end.strftime("%H:%M")))
                break
    return resolutions

class ScheduleApp:
    def __init__(self, root, events, working_hours):
        self.root = root
        self.events = events
        self.working_hours = working_hours
        self.canvas = tk.Canvas(root, width=400, height=300)
        self.canvas.pack()
        self.draw_schedule()
        self.conflicts = detect_conflicts(self.events)[1]
        self.display_conflicts()
        self.resolutions = suggest_resolutions(self.conflicts, self.events, self.working_hours)
        self.display_resolutions()

    def draw_schedule(self):
        for i, event in enumerate(self.events):
            start = parse_time(event[1])
            end = parse_time(event[2])
            y = 50 + i * 30
            self.canvas.create_rectangle(50, y, 350, y + 20, fill="lightblue")
            self.canvas.create_text(200, y + 10, text=f"{event[0]} ({event[1]} - {event[2]})")
            self.canvas.tag_bind(event[0], "<ButtonPress-1>", self.on_drag_start)
            self.canvas.tag_bind(event[0], "<B1-Motion>", self.on_drag_motion)

    def on_drag_start(self, event):
        self.drag_data = {"x": event.x, "y": event.y}

    def on_drag_motion(self, event):
        dx = event.x - self.drag_data["x"]
        dy = event.y - self.drag_data["y"]
        self.canvas.move("current", dx, dy)
        self.drag_data["x"] = event.x
        self.drag_data["y"] = event.y

    def display_conflicts(self):
        conflict_text = "\n".join([f"{conflict[0]} and {conflict[1]}" for conflict in self.conflicts])
        self.canvas.create_text(200, 200, text=f"Conflicting Events:\n{conflict_text}", fill="red")

    def display_resolutions(self):
        resolution_text = "\n".join([f"Reschedule \"{res[0]}\" to Start: {res[1]}, End: {res[2]}" for res in self.resolutions])
        self.canvas.create_text(200, 250, text=f"Suggested Resolutions:\n{resolution_text}", fill="green")

# Input Section
n = int(input("Enter number of events: "))
events = []
for _ in range(n):
    name = input("Enter event name: ")
    start_time = input("Enter start time (HH:MM): ")
    end_time = input("Enter end time (HH:MM): ")
    events.append((name, start_time, end_time))

working_start = input("Enter working hours start (HH:MM): ")
working_end = input("Enter working hours end (HH:MM): ")
working_hours = (datetime.strptime(working_start, "%H:%M").time(), datetime.strptime(working_end, "%H:%M").time())

# GUI Initialization
root = tk.Tk()
app = ScheduleApp(root, events, working_hours)
root.mainloop()
