import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import {
    FaPlus, FaLeaf, FaRulerCombined, FaSeedling,
    FaMountain, FaEdit, FaTrash, FaCalendarAlt
} from 'react-icons/fa';

const CROP_OPTIONS  = ['Carrot', 'Chilli', 'Potato', 'Tomato', 'Wheat'];
const STAGE_OPTIONS = [
    'Germination',
    'Seedling Stage',
    'Vegetative Growth / Root or Tuber Development',
    'Flowering',
    'Pollination',
    'Fruit/Grain/Bulb Formation',
    'Maturation',
    'Harvest',
];
const SOIL_OPTIONS = [
    'Alluvial Soil', 'Black Soil', 'Chalky Soil',
    'Clay Soil', 'Loam Soil', 'Red Soil', 'Sandy Soil',
];

const EMPTY_FORM = {
    fieldName: '', cropType: '', areaSize: '',
    seedlingStage: '', soilType: '',
};

const FieldsPage = () => {
    const [userEmail, setUserEmail]   = useState('');
    const [fields, setFields]         = useState([]);
    // ✅ No mock fallback — real data only
    const [events, setEvents]         = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);

    const [showAddModal, setShowAddModal]     = useState(false);
    const [newFieldData, setNewFieldData]     = useState(EMPTY_FORM);

    const [showEditModal, setShowEditModal]   = useState(false);
    const [editingField, setEditingField]     = useState(null);
    const [editFormData, setEditFormData]     = useState(EMPTY_FORM);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingField, setDeletingField]     = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const parsed = JSON.parse(stored);
            setUserEmail(parsed.email);
            fetchData(parsed.email);
        }
    }, []);

    const fetchData = async (email) => {
        setEventsLoading(true);
        try {
            // Real irrigation events — no mock fallback
            const eventRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/irrigation-events/${email}`
            );
            if (eventRes.data.status === 'success') {
                setEvents(eventRes.data.data); // empty array is fine — shows empty state
            }

            const fieldRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/fields/${email}`);
            if (fieldRes.data.status === 'success') {
                setFields(fieldRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setEventsLoading(false);
        }
    };

    // ── ADD ──────────────────────────────────────────────────────────────────
    const handleAddField = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/fields/add`, {
                userEmail, ...newFieldData,
            });
            if (res.data.status === 'success') {
                setFields([...fields, res.data.field]);
                setShowAddModal(false);
                setNewFieldData(EMPTY_FORM);
            } else {
                alert('Error: ' + res.data.message);
            }
        } catch {
            alert('Server error while adding field.');
        }
    };

    // ── EDIT ─────────────────────────────────────────────────────────────────
    const openEditModal = (field) => {
        setEditingField(field);
        setEditFormData({
            fieldName:     field.fieldName     || '',
            cropType:      field.cropType      || '',
            areaSize:      field.areaSize      || '',
            seedlingStage: field.seedlingStage || '',
            soilType:      field.soilType      || '',
        });
        setShowEditModal(true);
    };

    const handleEditField = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/fields/update/${editingField._id}`,
                editFormData
            );
            if (res.data.status === 'success') {
                setFields(fields.map(f =>
                    f._id === editingField._id ? res.data.field : f
                ));
                setShowEditModal(false);
                setEditingField(null);
            } else {
                alert('Error: ' + res.data.message);
            }
        } catch {
            alert('Server error while updating field.');
        }
    };

    // ── DELETE ───────────────────────────────────────────────────────────────
    const openDeleteModal = (field) => {
        setDeletingField(field);
        setShowDeleteModal(true);
    };

    const handleDeleteField = async () => {
        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/fields/delete/${deletingField._id}`
            );
            if (res.data.status === 'success') {
                setFields(fields.filter(f => f._id !== deletingField._id));
                setShowDeleteModal(false);
                setDeletingField(null);
            } else {
                alert('Error: ' + res.data.message);
            }
        } catch {
            alert('Server error while deleting field.');
        }
    };

    // ── PAGINATION ───────────────────────────────────────────────────────────
    const indexOfLastItem  = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEvents    = events.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages       = Math.ceil(events.length / itemsPerPage);

    // ── SHARED FORM ──────────────────────────────────────────────────────────
    const FieldForm = ({ data, setData, onSubmit, submitLabel }) => (
        <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Field Name</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="e.g., Field A, North Plot"
                    required
                    value={data.fieldName}
                    onChange={e => setData({ ...data, fieldName: e.target.value })}
                />
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Crop Type</Form.Label>
                <Form.Select
                    required
                    value={data.cropType}
                    onChange={e => setData({ ...data, cropType: e.target.value })}
                    className="bg-light"
                >
                    <option value="" disabled>Select a crop...</option>
                    {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Current Seedling Stage</Form.Label>
                <Form.Select
                    required
                    value={data.seedlingStage}
                    onChange={e => setData({ ...data, seedlingStage: e.target.value })}
                    className="bg-light"
                >
                    <option value="" disabled>Select stage...</option>
                    {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted">Soil Type</Form.Label>
                <Form.Select
                    required
                    value={data.soilType}
                    onChange={e => setData({ ...data, soilType: e.target.value })}
                    className="bg-light"
                >
                    <option value="" disabled>Select soil type...</option>
                    {SOIL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted">
                    Area Size (Optional)
                </Form.Label>
                <Form.Control
                    type="text"
                    placeholder="e.g., 5 Acres, 1000 sq ft"
                    value={data.areaSize}
                    onChange={e => setData({ ...data, areaSize: e.target.value })}
                />
            </Form.Group>

            <Button
                type="submit"
                className="w-100 fw-bold py-2 border-0"
                style={{ backgroundColor: '#10b981' }}
            >
                {submitLabel}
            </Button>
        </Form>
    );

    // ── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="container-fluid p-4 bg-white" style={{ minHeight: '100vh' }}>

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Fields & Reports</h3>
                    <p className="text-muted small mb-0">
                        Manage your active fields and view irrigation logs.
                    </p>
                </div>
                <button
                    className="btn text-white fw-bold shadow-sm d-flex align-items-center gap-2"
                    style={{ backgroundColor: '#10b981' }}
                    onClick={() => setShowAddModal(true)}
                >
                    <FaPlus /> Add New Field
                </button>
            </div>

            {/* FIELD CARDS */}
            <h5 className="fw-bold text-secondary mb-3">My Active Fields</h5>
            <div className="row mb-5">
                {fields.length > 0 ? (
                    fields.map((field, index) => (
                        <div className="col-md-4 col-lg-3 mb-3" key={field._id || index}>
                            <div
                                className="card shadow-sm border-0 h-100"
                                style={{ borderTop: '4px solid #10b981' }}
                            >
                                <div className="card-body pb-2">
                                    <h6 className="fw-bold text-dark mb-3">{field.fieldName}</h6>

                                    <div className="d-flex align-items-center mb-2 small text-muted">
                                        <FaLeaf className="me-2 text-success flex-shrink-0" />
                                        <strong>Crop:</strong>
                                        <span className="ms-1">{field.cropType || 'Not specified'}</span>
                                    </div>

                                    <div className="d-flex align-items-start mb-2 small text-muted">
                                        <FaSeedling className="me-2 flex-shrink-0 mt-1" style={{ color: '#d97706' }} />
                                        <div>
                                            <strong>Stage:</strong>
                                            <span className="ms-1">{field.seedlingStage || 'Not specified'}</span>
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center mb-2 small text-muted">
                                        <FaMountain className="me-2 flex-shrink-0" style={{ color: '#8b4513' }} />
                                        <strong>Soil:</strong>
                                        <span className="ms-1">{field.soilType || 'Not specified'}</span>
                                    </div>

                                    <div className="d-flex align-items-center mb-3 small text-muted">
                                        <FaRulerCombined className="me-2 text-secondary flex-shrink-0" />
                                        <strong>Size:</strong>
                                        <span className="ms-1">{field.areaSize || 'Not specified'}</span>
                                    </div>

                                    <div className="d-flex gap-2 pt-2 border-top">
                                        <button
                                            className="btn btn-sm fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                            style={{
                                                backgroundColor: '#e2efeb',
                                                color: '#10b981',
                                                border: '1px solid #10b981',
                                                fontSize: '0.78rem',
                                            }}
                                            onClick={() => openEditModal(field)}
                                        >
                                            <FaEdit size={11} /> Edit
                                        </button>
                                        <button
                                            className="btn btn-sm fw-bold flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                                            style={{
                                                backgroundColor: '#fff5f5',
                                                color: '#dc2626',
                                                border: '1px solid #dc2626',
                                                fontSize: '0.78rem',
                                            }}
                                            onClick={() => openDeleteModal(field)}
                                        >
                                            <FaTrash size={11} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12">
                        <div className="p-4 bg-light rounded-3 text-center text-muted">
                            No fields added yet. Click "Add New Field" to get started.
                        </div>
                    </div>
                )}
            </div>

            {/* IRRIGATION EVENTS TABLE */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div
                    className="card-header text-white text-center py-3 fw-bold fs-5"
                    style={{ backgroundColor: '#10b981' }}
                >
                    Recent Irrigation Events
                </div>
                <div className="table-responsive">
                    <table className="table table-bordered table-hover text-center mb-0 align-middle">
                        <thead style={{ backgroundColor: '#064e3b' }}>
                            <tr>
                                <th className="py-3 border-0 bg-transparent text-white">Date</th>
                                <th className="py-3 border-0 bg-transparent text-white">Time</th>
                                <th className="py-3 border-0 bg-transparent text-white">Field</th>
                                <th className="py-3 border-0 bg-transparent text-white">Duration</th>
                                <th className="py-3 border-0 bg-transparent text-white">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventsLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-5 text-muted">
                                        <div className="spinner-border spinner-border-sm text-success me-2" />
                                        Loading events...
                                    </td>
                                </tr>
                            ) : currentEvents.length > 0 ? (
                                currentEvents.map((event, index) => (
                                    <tr key={event._id || index}>
                                        <td className="py-3 text-secondary">{event.date}</td>
                                        <td className="py-3 text-secondary">{event.time}</td>
                                        <td className="py-3 text-secondary">{event.fieldName}</td>
                                        <td className="py-3 text-secondary">{event.duration}</td>
                                        <td className="py-3 fw-bold text-success">{event.status}</td>
                                    </tr>
                                ))
                            ) : (
                                // ✅ Real empty state — no hardcoded mock data
                                <tr>
                                    <td colSpan="5" className="py-5 text-muted">
                                        <FaCalendarAlt
                                            style={{
                                                fontSize: '2rem', opacity: 0.2,
                                                display: 'block', margin: '0 auto 8px',
                                            }}
                                        />
                                        No irrigation events recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-end mt-4 gap-2">
                    <button
                        className="btn btn-dark btn-sm px-3"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={`btn btn-sm px-3 fw-bold ${
                                currentPage === i + 1 ? 'text-white' : 'btn-outline-secondary'
                            }`}
                            style={currentPage === i + 1
                                ? { backgroundColor: '#10b981', borderColor: '#10b981' }
                                : {}}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        className="btn btn-dark btn-sm px-3"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* ADD MODAL */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold" style={{ color: '#10b981' }}>
                        Add New Field
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FieldForm
                        data={newFieldData}
                        setData={setNewFieldData}
                        onSubmit={handleAddField}
                        submitLabel="Save Field"
                    />
                </Modal.Body>
            </Modal>

            {/* EDIT MODAL */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold" style={{ color: '#10b981' }}>
                        Edit Field
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FieldForm
                        data={editFormData}
                        setData={setEditFormData}
                        onSubmit={handleEditField}
                        submitLabel="Update Field"
                    />
                </Modal.Body>
            </Modal>

            {/* DELETE CONFIRM MODAL */}
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered size="sm"
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold text-danger" style={{ fontSize: '1rem' }}>
                        Delete Field
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center pt-2">
                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{
                            width: '56px', height: '56px',
                            backgroundColor: '#fff5f5',
                            border: '2px solid #fecaca',
                        }}
                    >
                        <FaTrash style={{ color: '#dc2626', fontSize: '1.3rem' }} />
                    </div>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                        Are you sure you want to delete{' '}
                        <strong>{deletingField?.fieldName}</strong>?
                        This cannot be undone.
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0 d-flex gap-2">
                    <Button
                        variant="light"
                        className="flex-grow-1 fw-bold"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        className="flex-grow-1 fw-bold"
                        onClick={handleDeleteField}
                    >
                        Yes, Delete
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default FieldsPage;