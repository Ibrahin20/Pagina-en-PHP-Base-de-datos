<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

class Database {
    private $pdo;
    
    public function __construct() {
        $host = 'localhost';
        $dbname = 'rifas_ganadores';
        $username = 'root';
        $password = '';
        
        try {
            $this->pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            $this->sendError('Error de conexión: ' . $e->getMessage());
        }
    }
    
    public function buscarGanadores($search = '') {
        if (!empty($search)) {
            $sql = "SELECT * FROM ganadores 
                    WHERE nombre LIKE :search 
                    OR ticket_ganador LIKE :search 
                    OR premio LIKE :search 
                    OR direccion LIKE :search 
                    OR telefono LIKE :search 
                    OR placa_premio LIKE :search 
                    ORDER BY fecha_registro DESC";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute(['search' => "%$search%"]);
        } else {
            $sql = "SELECT * FROM ganadores ORDER BY fecha_registro DESC";
            $stmt = $this->pdo->query($sql);
        }
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function obtenerGanador($id) {
        $sql = "SELECT * FROM ganadores WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function insertarGanador($data) {
        $sql = "INSERT INTO ganadores (nombre, tickets_comprados, ticket_ganador, premio, direccion, telefono, placa_premio) 
                VALUES (:nombre, :tickets_comprados, :ticket_ganador, :premio, :direccion, :telefono, :placa_premio)";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $data['nombre'],
            ':tickets_comprados' => $data['tickets_comprados'],
            ':ticket_ganador' => $data['ticket_ganador'],
            ':premio' => $data['premio'],
            ':direccion' => $data['direccion'],
            ':telefono' => $data['telefono'],
            ':placa_premio' => $data['placa_premio']
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    public function actualizarGanador($id, $data) {
        $sql = "UPDATE ganadores 
                SET nombre = :nombre, 
                    tickets_comprados = :tickets_comprados, 
                    ticket_ganador = :ticket_ganador, 
                    premio = :premio, 
                    direccion = :direccion, 
                    telefono = :telefono, 
                    placa_premio = :placa_premio 
                WHERE id = :id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':nombre' => $data['nombre'],
            ':tickets_comprados' => $data['tickets_comprados'],
            ':ticket_ganador' => $data['ticket_ganador'],
            ':premio' => $data['premio'],
            ':direccion' => $data['direccion'],
            ':telefono' => $data['telefono'],
            ':placa_premio' => $data['placa_premio']
        ]);
        
        return $stmt->rowCount();
    }
    
    public function eliminarGanador($id) {
        $sql = "DELETE FROM ganadores WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount();
    }
    
    private function sendError($message) {
        echo json_encode(['error' => $message]);
        exit;
    }
}

// Procesar solicitudes
$db = new Database();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        // Obtener un ganador específico
        $ganador = $db->obtenerGanador($_GET['id']);
        echo json_encode($ganador);
    } else {
        // Buscar ganadores
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $resultados = $db->buscarGanadores($search);
        echo json_encode($resultados);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $id = $db->insertarGanador($data);
        echo json_encode(['success' => true, 'id' => $id]);
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Error al insertar: ' . $e->getMessage()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $id = $data['id'];
        unset($data['id']); // Remover el id del array de datos
        $affected = $db->actualizarGanador($id, $data);
        echo json_encode(['success' => true, 'affected' => $affected]);
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Error al actualizar: ' . $e->getMessage()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $affected = $db->eliminarGanador($data['id']);
        echo json_encode(['success' => true, 'affected' => $affected]);
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Error al eliminar: ' . $e->getMessage()]);
    }
}
?>