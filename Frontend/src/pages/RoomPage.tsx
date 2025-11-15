import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useSocket } from '../hooks/useSocket';
import { useRoomStore } from '../stores/roomStore';
import { useTaskDetailsStore } from '../stores/taskDetailsStore';
import { useRoomNavigation } from '../hooks/useRoomNavigation';
import { useEstimateCalculations } from '../hooks/useEstimateCalculations';
import { useTaskHandlers } from '../hooks/useTaskHandlers';
import { useTaskSelection } from '../hooks/useTaskSelection';
import { useAutoFinalEstimate } from '../hooks/useAutoFinalEstimate';
import { socketService } from '../services/socketService';
import type { Task } from '../types';
import AddTaskModal from '../components/AddTaskModal';
import WarningModal from '../components/WarningModal';
import LoadingState from '../components/LoadingState';
import ErrorAlert from '../components/ErrorAlert';
import RoomHeader from '../components/RoomHeader';
import TaskList from '../components/TaskList';
import ParticipantsList from '../components/ParticipantsList';
import TaskDetails from '../components/TaskDetails';

export default function RoomPage() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const navigate = useNavigate();
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    const {
        room,
        currentUser,
        isConnected,
        error,
        reset,
    } = useRoomStore();

    const {
        updateTaskDetails,
        setOnEstimate,
        setOnFinalEstimateChange,
        setOnReveal,
    } = useTaskDetailsStore();

    const {
        createTask,
        deleteTask,
        selectTask,
        estimateTask,
        revealEstimates,
        resetEstimates,
        setFinalEstimate,
    } = useSocket({
        onError: (err) => {
            console.error('Socket error:', err.message);
        },
    });

    useRoomNavigation(roomCode, room, isConnected);

    const isCreator = currentUser?.role === 'creator';
    const creatorCanParticipate = isCreator && currentUser?.participationMode === 'participant';
    const isParticipant = currentUser?.role === 'participant' || creatorCanParticipate;
    const currentTask = room?.tasks.find((t) => t.id === room.currentTaskId) as Task | undefined;

    const {
        currentUserEstimate,
        numericCardSet,
        estimatesForCurrentTask,
        averageEstimate,
        medianEstimate,
        totalParticipants,
        votedParticipants,
    } = useEstimateCalculations(room, currentUser, room?.currentTaskId ?? null);

    const {
        handleEstimate,
        handleFinalEstimateChange,
        handleReveal,
        handleAddTask,
        handleDeleteTask,
    } = useTaskHandlers({
        room,
        roomCode,
        isCreator,
        isParticipant,
        createTask,
        deleteTask,
        estimateTask,
        revealEstimates,
        resetEstimates,
        setFinalEstimate,
        setShowAddTaskModal,
    });

    const {
        handleSelectTask,
        warningModal,
        closeWarningModal,
    } = useTaskSelection({
        room,
        roomCode,
        isCreator,
        selectTask,
        setFinalEstimate,
    });

    useAutoFinalEstimate({
        isCreator,
        room,
        currentTask,
        roomCode,
        medianEstimate,
        estimatesForCurrentTask,
        setFinalEstimate,
    });

    const handleLeave = () => {
        socketService.disconnect();
        reset();
        navigate('/');
    };

    // Update task details store
    useEffect(() => {
        if (!room || !currentUser) return;
        updateTaskDetails({
            currentTask: currentTask || null,
            isCreator,
            isParticipant,
            currentUserEstimate,
            numericCardSet,
            estimatesForCurrentTask,
            averageEstimate,
            medianEstimate,
            votedParticipants,
            totalParticipants,
        });
    }, [
        currentTask,
        isCreator,
        isParticipant,
        currentUserEstimate,
        numericCardSet,
        estimatesForCurrentTask,
        averageEstimate,
        medianEstimate,
        votedParticipants,
        totalParticipants,
        updateTaskDetails,
        room,
        currentUser,
    ]);

    // Set handlers
    useEffect(() => {
        setOnEstimate(handleEstimate);
        setOnFinalEstimateChange(handleFinalEstimateChange);
        setOnReveal(handleReveal);
    }, [handleEstimate, handleFinalEstimateChange, handleReveal, setOnEstimate, setOnFinalEstimateChange, setOnReveal]);

    if (!room || !currentUser || !roomCode) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                {error && <ErrorAlert message={error} />}

                <RoomHeader
                    roomName={room.name}
                    roomCode={roomCode!}
                    isCreator={isCreator}
                    isRevealed={room.isRevealed}
                    hasCurrentTask={!!room.currentTaskId}
                    onLeave={handleLeave}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                    <div className="lg:col-span-1 space-y-6 lg:space-y-8">
                        <TaskList
                            tasks={room.tasks}
                            currentTaskId={room.currentTaskId}
                            isCreator={isCreator}
                            onSelectTask={handleSelectTask}
                            onDeleteTask={handleDeleteTask}
                            onAddTask={() => setShowAddTaskModal(true)}
                        />

                        <ParticipantsList
                            participants={room.participants}
                            isCreator={isCreator}
                            onRemoveParticipant={roomCode ? (participantId) => {
                                socketService.removeParticipant({ roomCode, participantId });
                            } : undefined}
                        />
                    </div>

                    <div className="lg:col-span-2">
                        {currentTask ? (
                            <TaskDetails cardSet={room.cardSet} />
                        ) : (
                            <div className="bg-card backdrop-blur-sm rounded-2xl shadow-lg border border-border p-16 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-foreground">Aucune fiche sélectionnée</p>
                                <p className="text-sm text-muted-foreground mt-2">Sélectionnez une fiche pour commencer l'estimation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddTaskModal
                isOpen={showAddTaskModal}
                onClose={() => setShowAddTaskModal(false)}
                onAdd={handleAddTask}
            />

            <WarningModal
                isOpen={warningModal.isOpen}
                onClose={closeWarningModal}
                onConfirm={warningModal.onConfirm}
                title={warningModal.title}
                message={warningModal.message}
                confirmText="Confirmer"
                cancelText="Annuler"
            />
        </div>
    );
}
