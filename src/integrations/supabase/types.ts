export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cotacoes: {
        Row: {
          created_at: string
          fornecedor_id: string
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fornecedor_id: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          fornecedor_id?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          bairro: string
          cidade: string | null
          contato: string
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          segmento_id: string | null
          segmento_nome: string | null
          site: string | null
          telefone: string | null
          uf: string
          updated_at: string
          user_id: string
          vendedor: string | null
          whatsapp: string | null
        }
        Insert: {
          bairro: string
          cidade?: string | null
          contato: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          segmento_id?: string | null
          segmento_nome?: string | null
          site?: string | null
          telefone?: string | null
          uf: string
          updated_at?: string
          user_id?: string
          vendedor?: string | null
          whatsapp?: string | null
        }
        Update: {
          bairro?: string
          cidade?: string | null
          contato?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          segmento_id?: string | null
          segmento_nome?: string | null
          site?: string | null
          telefone?: string | null
          uf?: string
          updated_at?: string
          user_id?: string
          vendedor?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_cotacao: {
        Row: {
          arquivado: boolean
          codigo: string | null
          cotacao_id: string
          created_at: string
          descricao: string
          frete: string | null
          garantia: string | null
          id: string
          interesse: number
          marca: string | null
          modelo: string | null
          observacoes: string | null
          oportunidade: boolean
          pagamento: string | null
          prazo_entrega: string | null
          preco_medio_online: number | null
          preco_online_fonte: string | null
          preco_online_pesquisado_em: string | null
          preco_online_url: string | null
          qtd_minima: number | null
          quantidade: number | null
          unidade: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          arquivado?: boolean
          codigo?: string | null
          cotacao_id: string
          created_at?: string
          descricao: string
          frete?: string | null
          garantia?: string | null
          id?: string
          interesse?: number
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          oportunidade?: boolean
          pagamento?: string | null
          prazo_entrega?: string | null
          preco_medio_online?: number | null
          preco_online_fonte?: string | null
          preco_online_pesquisado_em?: string | null
          preco_online_url?: string | null
          qtd_minima?: number | null
          quantidade?: number | null
          unidade?: string | null
          updated_at?: string
          user_id?: string
          valor: number
        }
        Update: {
          arquivado?: boolean
          codigo?: string | null
          cotacao_id?: string
          created_at?: string
          descricao?: string
          frete?: string | null
          garantia?: string | null
          id?: string
          interesse?: number
          marca?: string | null
          modelo?: string | null
          observacoes?: string | null
          oportunidade?: boolean
          pagamento?: string | null
          prazo_entrega?: string | null
          preco_medio_online?: number | null
          preco_online_fonte?: string | null
          preco_online_pesquisado_em?: string | null
          preco_online_url?: string | null
          qtd_minima?: number | null
          quantidade?: number | null
          unidade?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_cotacao_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          canal: string | null
          canal_confirmacao: string | null
          confirmado_em: string | null
          cotacao_id: string
          created_at: string
          entrega_prevista: string | null
          entrega_realizada: string | null
          enviado_em: string | null
          fornecedor_confirmado: boolean
          fornecedor_id: string
          id: string
          itens: Json
          mensagem: string | null
          observacao_confirmacao: string | null
          observacao_entrega: string | null
          total: number
          total_confirmado: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          canal?: string | null
          canal_confirmacao?: string | null
          confirmado_em?: string | null
          cotacao_id: string
          created_at?: string
          entrega_prevista?: string | null
          entrega_realizada?: string | null
          enviado_em?: string | null
          fornecedor_confirmado?: boolean
          fornecedor_id: string
          id?: string
          itens?: Json
          mensagem?: string | null
          observacao_confirmacao?: string | null
          observacao_entrega?: string | null
          total?: number
          total_confirmado?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          canal?: string | null
          canal_confirmacao?: string | null
          confirmado_em?: string | null
          cotacao_id?: string
          created_at?: string
          entrega_prevista?: string | null
          entrega_realizada?: string | null
          enviado_em?: string | null
          fornecedor_confirmado?: boolean
          fornecedor_id?: string
          id?: string
          itens?: Json
          mensagem?: string | null
          observacao_confirmacao?: string | null
          observacao_entrega?: string | null
          total?: number
          total_confirmado?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      segmentos: {
        Row: {
          created_at: string
          id: string
          nome: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      criar_cotacao_completa: {
        Args: {
          p_fornecedor_id: string
          p_itens: Json
          p_observacoes: string
          p_status: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
