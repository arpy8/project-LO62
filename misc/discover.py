import bluetooth

# Discover devices nearby
print("Searching for devices...")
devices = bluetooth.discover_devices(duration=8, lookup_names=True)

if not devices:
    print("No devices found.")
else:
    print("Devices found:")
    for addr, name in devices:
        print(f"  {name} - {addr}")

# Choose a device to query its services
device_address = input("\nEnter the address of the device to scan for services: ")

# Discover services provided by the device
print(f"Discovering services on {device_address}...")
services = bluetooth.find_service(address=device_address)

if not services:
    print("No services found.")
else:
    print("Available services:")
    for service in services:
        print(f"""
        Service Name: {service['name']}
        Host: {service['host']}
        Description: {service['description']}
        Provided By: {service['provider']}
        Protocol: {service['protocol']}
        Service ID: {service['service-id']}
        Service Classes: {service['service-classes']}
        Profiles: {service['profiles']}
        """)

