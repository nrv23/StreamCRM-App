

export interface CreateLogDto {
    entity_type: string,
    entity_id: number,
    action: number,
    changed_by_user_id: number,
    old_values: JSON,
    new_values: JSON,
}