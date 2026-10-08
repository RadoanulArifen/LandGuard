"""SQLAlchemy tables: the six source datasets + the analysis results table."""
from sqlalchemy import Column, Float, ForeignKey, Index, Integer, String, Text
from app.database.db import Base


class Parcel(Base):
    __tablename__ = "parcels"
    parcel_id = Column(String, primary_key=True)
    district = Column(String, index=True)
    upazila = Column(String, index=True)
    mouza = Column(String, index=True)
    khatian_no = Column(String, index=True)
    dag_no = Column(String, index=True)
    land_type = Column(String)
    total_area_decimal = Column(Float)
    current_owner_id = Column(String, ForeignKey("owners.owner_id"), index=True)
    ownership_status = Column(String)
    registration_status = Column(String)
    mutation_status = Column(String)
    creation_date = Column(String)


class Owner(Base):
    __tablename__ = "owners"
    owner_id = Column(String, primary_key=True)
    owner_type = Column(String)
    synthetic_name = Column(String, index=True)
    gender = Column(String)
    age_group = Column(String)
    district = Column(String)
    occupation_category = Column(String)
    ownership_count = Column(Integer)
    owner_status = Column(String)
    first_recorded_ownership_date = Column(String)
    last_verified_date = Column(String)


class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(String, primary_key=True)
    parcel_id = Column(String, ForeignKey("parcels.parcel_id"), index=True)
    seller_id = Column(String, ForeignKey("owners.owner_id"), index=True)
    buyer_id = Column(String, ForeignKey("owners.owner_id"), index=True)
    transaction_type = Column(String)
    transaction_date = Column(String, index=True)
    transferred_area_decimal = Column(Float)
    seller_share_before = Column(Float)
    transferred_share = Column(Float)
    buyer_share_after = Column(Float)
    seller_share_after = Column(Float)
    transaction_value_bdt = Column(Integer)
    transaction_status = Column(String)
    previous_owner_id = Column(String, ForeignKey("owners.owner_id"))
    ownership_sequence = Column(Integer)
    days_since_previous_transfer = Column(Float)


class Registration(Base):
    __tablename__ = "registrations"
    registration_id = Column(String, primary_key=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), index=True)
    parcel_id = Column(String, ForeignKey("parcels.parcel_id"), index=True)
    seller_id = Column(String, ForeignKey("owners.owner_id"))
    buyer_id = Column(String, ForeignKey("owners.owner_id"))
    registered_area_decimal = Column(Float)
    registration_date = Column(String)
    registration_status = Column(String)
    registration_office_code = Column(String)
    deed_reference = Column(String)
    registration_type = Column(String)
    registration_fee_bdt = Column(Integer)
    verification_status = Column(String)
    registration_delay_days = Column(Float)


class Mutation(Base):
    __tablename__ = "mutations"
    mutation_id = Column(String, primary_key=True)
    registration_id = Column(String, ForeignKey("registrations.registration_id"), index=True)
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), index=True)
    parcel_id = Column(String, ForeignKey("parcels.parcel_id"), index=True)
    previous_owner_id = Column(String, ForeignKey("owners.owner_id"))
    new_owner_id = Column(String, ForeignKey("owners.owner_id"))
    mutated_area_decimal = Column(Float)
    previous_owner_share = Column(Float)
    mutated_owner_share = Column(Float)
    mutation_date = Column(String)
    mutation_status = Column(String)
    mutation_type = Column(String)
    mutation_office_code = Column(String)
    mutation_reference = Column(String)
    mutation_delay_days = Column(Float)
    verification_status = Column(String)


class FraudLabel(Base):
    """Synthetic ground truth. Used ONLY for ML training/evaluation, never as an input feature."""
    __tablename__ = "fraud_labels"
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), primary_key=True)
    parcel_id = Column(String, ForeignKey("parcels.parcel_id"), index=True)
    double_sale_flag = Column(Integer)
    over_transfer_flag = Column(Integer)
    rapid_transfer_flag = Column(Integer)
    ownership_chain_break_flag = Column(Integer)
    registration_mismatch_flag = Column(Integer)
    mutation_mismatch_flag = Column(Integer)
    temporal_inconsistency_flag = Column(Integer)
    anomaly_count = Column(Integer)
    primary_anomaly_type = Column(String)
    anomaly_severity = Column(String)
    ground_truth_label = Column(Integer, index=True)
    ground_truth_reason = Column(Text)
    double_sale_confidence_rule = Column(String)
    evidence_rapid_transfer_days = Column(Float)
    evidence_transferred_share = Column(Float)
    evidence_seller_share_before = Column(Float)
    evidence_transaction_area = Column(Float)
    evidence_registered_area = Column(Float)
    evidence_mutated_area = Column(Float)
    evidence_registration_delay_days = Column(Float)
    evidence_mutation_delay_days = Column(Float)


class Analysis(Base):
    """Output of the LandGuard engine (rules + ML + score) for each transaction."""
    __tablename__ = "analysis_results"
    transaction_id = Column(String, ForeignKey("transactions.transaction_id"), primary_key=True)
    parcel_id = Column(String, ForeignKey("parcels.parcel_id"), index=True)
    double_sale = Column(Integer, default=0)
    over_transfer = Column(Integer, default=0)
    rapid_transfer = Column(Integer, default=0)       # 0 none, 1 moderate, 2 strong
    ownership_chain_break = Column(Integer, default=0)
    registration_mismatch = Column(Integer, default=0)
    mutation_mismatch = Column(Integer, default=0)
    temporal_inconsistency = Column(Integer, default=0)
    signal_count = Column(Integer, default=0)
    rule_points = Column(Float, default=0.0)
    ml_score = Column(Float, default=0.0)             # 0..1 anomaly score from the ML model
    priority_score = Column(Float, default=0.0, index=True)   # 0..100
    priority_level = Column(String, index=True)
    primary_signal = Column(String, index=True)
    evidence_json = Column(Text)                      # list of evidence items (JSON)


Index("ix_tx_parcel_date", Transaction.parcel_id, Transaction.transaction_date)
