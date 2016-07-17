@extends('layouts.dashboard')

@section('page_title')
    Шаблоны
@endsection

@section('content_title')
    Все шаблоны
@endsection()

@section('content')
    <?php $i = ($templates->currentPage() - 1) * 10 + 1?>
    <table class="table">
        <thead>
            <th class="numberlist">№</th>
            <th>Название</th>
            <th>Путь</th>
            <th>Действия</th>
        </thead>
        <tbody>
        @foreach($templates as $template)
            <tr>
                <td>{{ $i++ }}</td>
                <td>{{ $template->name }}</td>
                <td>{{ $template->path }}</td>
                <td>
                    @unless($template->name == 'main')
                        <a class="btn btn-default btn-sm" href="{{ route('edit_template', $template->id) }}">Редактировать</a>
                        <a class="btn btn-danger btn-sm" href="{{ route('delete_template', $template->id) }}">Удалить</a>
                    @endunless
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>
    {{ $templates->render() }}
    <br>
    <p><a class="btn btn-primary btn-square" href="{{ route('create_template') }}">Создать новый</a></p>
@endsection