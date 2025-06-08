import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { useUser } from "./AuthContext";
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

type ExamResult = {
  id: string;
  timestamp: { seconds: number; nanoseconds: number };
  result: {
    questions: Array<{
      questionNumber: string;
      question: string;
      maxMarks: string;
      studentAnswer: string;
      mark: string;
      comment: string;
    }>;
    total: string;
  };
  studentFileName: string;
  schemeFileName: string;
};

function Dashboard() {
  const [exams, setExams] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const user = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user === undefined) return; // Wait for auth
    if (!user) return;
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await getIdToken(auth.currentUser!);
      const response = await fetch("https://ai-examiner-79zf.onrender.com/exams", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch exams");
      const data = await response.json();
      setExams(data);
    } catch (error) {
      setError("Failed to load exam history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date";
    // Firestore Timestamp object
    if (typeof timestamp === "object" && typeof timestamp.seconds === "number") {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    // String date
    if (typeof timestamp === "string") {
      const d = new Date(timestamp);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return timestamp; // fallback to raw string
    }
    return "Unknown date";
  };

  const viewExamDetails = (exam: ExamResult) => {
    setSelectedExam(exam);
    onOpen();
  };

  if (!user) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" mb={4}>Please log in to view your exam history</Heading>
        <Button colorScheme="green" onClick={() => window.location.href = "/auth"}>
          Login
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Text fontSize="lg" color="red.500">{error}</Text>
          <Button colorScheme="green" onClick={fetchExams}>Retry</Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgImage="url('/background.jpg')" bgSize="cover" bgPosition="center" px={2} py={10}>
      <Box maxW="1100px" mx="auto" bg="white" borderRadius="2xl" boxShadow="2xl" p={[4, 8]}>
        <Heading size="lg" mb={8} color="gray.800" fontWeight="extrabold" letterSpacing="tight">
          Your Exam History
        </Heading>
        {exams.length === 0 ? (
          <VStack spacing={4} py={16}>
            <Text fontSize="lg" color="gray.500">No exams marked yet.</Text>
            <Text fontSize="md" color="gray.400">Start by marking your first exam!</Text>
          </VStack>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="md">
              <Thead bg="gray.50">
                <Tr>
                  <Th color="gray.600" fontWeight="bold">Date</Th>
                  <Th color="gray.600" fontWeight="bold">Student Paper</Th>
                  <Th color="gray.600" fontWeight="bold">Scheme</Th>
                  <Th color="gray.600" fontWeight="bold">Total Score</Th>
                  <Th color="gray.600" fontWeight="bold">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {exams.map((exam) => (
                  <Tr key={exam.id} _hover={{ bg: "green.50" }}>
                    <Td fontWeight="medium">{formatDate(exam.timestamp)}</Td>
                    <Td>{exam.studentFileName}</Td>
                    <Td>{exam.schemeFileName}</Td>
                    <Td>
                      <Badge colorScheme="green" fontSize="md" px={2} py={1} borderRadius="md">
                        {exam.result.total}
                      </Badge>
                    </Td>
                    <Td>
                      <Button size="sm" colorScheme="green" variant="outline" onClick={() => navigate(`/exam/${exam.id}`)}>
                        View Details
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered motionPreset="slideInBottom">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" boxShadow="2xl">
          <ModalHeader fontWeight="bold" color="green.700" fontSize="2xl" borderBottom="1px solid #e2e8f0">
            Exam Marking Breakdown
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} bg="gray.50">
            {selectedExam && (
              <VStack spacing={6} align="stretch">
                {selectedExam.result.questions.map((q, index) => (
                  <Box key={index} p={5} bg="white" borderRadius="xl" boxShadow="md" border="1px solid #E2E8F0">
                    <Text fontWeight="bold" fontSize="lg" mb={1} color="green.700">
                      Question {q.questionNumber} <Badge colorScheme="green">{q.mark}/{q.maxMarks}</Badge>
                    </Text>
                    <Text fontSize="md" color="gray.700" mb={2}>
                      <strong>Question:</strong> {q.question}
                    </Text>
                    <Box mb={3}>
                      <Text fontWeight="semibold" mb={1} color="gray.600">Student Answer:</Text>
                      <Text whiteSpace="pre-line" color="gray.800">{q.studentAnswer.trim()}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb={1} color="gray.600">Examiner Comment:</Text>
                      <Text whiteSpace="pre-line" color="gray.700">{q.comment}</Text>
                    </Box>
                  </Box>
                ))}
                <Box p={4} borderWidth={1} borderRadius="md" bg="green.50" textAlign="center">
                  <Text fontWeight="bold" color="green.700" fontSize="lg">Total Score: {selectedExam.result.total}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard; 