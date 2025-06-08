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

  useEffect(() => {
    if (!user) return;
    fetchExams();
  }, [user]);

  const fetchExams = async () => {
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
      toast({
        title: "Error",
        description: "Failed to load exam history",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
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
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Your Exam History</Heading>
        
        {exams.length === 0 ? (
          <Text>No exams marked yet. Start by marking your first exam!</Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Student Paper</Th>
                <Th>Scheme</Th>
                <Th>Total Score</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {exams.map((exam) => (
                <Tr key={exam.id}>
                  <Td>{formatDate(exam.timestamp)}</Td>
                  <Td>{exam.studentFileName}</Td>
                  <Td>{exam.schemeFileName}</Td>
                  <Td>
                    <Badge colorScheme="green" fontSize="md">
                      {exam.result.total}
                    </Badge>
                  </Td>
                  <Td>
                    <Button size="sm" onClick={() => viewExamDetails(exam)}>
                      View Details
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Exam Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedExam && (
              <VStack spacing={4} align="stretch">
                {selectedExam.result.questions.map((q, index) => (
                  <Box key={index} p={4} borderWidth={1} borderRadius="md">
                    <Text fontWeight="bold">Question {q.questionNumber}</Text>
                    <Text mt={2}>{q.question}</Text>
                    <Text mt={2}>Student Answer: {q.studentAnswer}</Text>
                    <Text mt={2}>Marks: {q.mark}/{q.maxMarks}</Text>
                    <Text mt={2}>Feedback: {q.comment}</Text>
                  </Box>
                ))}
                <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
                  <Text fontWeight="bold">Total Score: {selectedExam.result.total}</Text>
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