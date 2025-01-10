import bluetooth

# Leave empty or specify your local Bluetooth adapter's MAC address
hostMACAddress = ""  
port = 200  # Commonly used for SPP
backlog = 1
size = 1024

# Create and bind the Bluetooth socket
s = bluetooth.BluetoothSocket(bluetooth.RFCOMM)
s.bind((hostMACAddress, port))
s.listen(backlog)

print("Waiting for a connection...")

try:
    client, clientInfo = s.accept()
    print(f"Connection accepted from {clientInfo}")

    while True:
        data = client.recv(size)  # Receive data
        if data:
            print(f"Received: {data.decode('utf-8')}")
            client.send(data)  # Echo back the received data
except Exception as e:
    print(f"Error: {e}")
finally:
    print("Closing socket")
    client.close()
    s.close()